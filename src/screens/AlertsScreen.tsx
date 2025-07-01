import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  IconButton,
  Chip,
  Surface,
  Searchbar,
  FAB,
} from 'react-native-paper';

import { useSocket } from '../context/SocketContext';
import { theme, deviceColors } from '../theme/theme';

interface AlertItem {
  id: string;
  device: string;
  command: string;
  user: string;
  userId: string;
  timestamp: string;
  read: boolean;
}

const AlertsScreen: React.FC = () => {
  const { alerts, refreshAlerts, markAlertAsRead, isConnected } = useSocket();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAlerts, setFilteredAlerts] = useState<AlertItem[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    refreshAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, searchQuery, showUnreadOnly]);

  const filterAlerts = () => {
    let filtered = [...alerts];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        alert =>
          alert.device.toLowerCase().includes(query) ||
          alert.command.toLowerCase().includes(query) ||
          alert.user.toLowerCase().includes(query)
      );
    }

    // Filter by read status
    if (showUnreadOnly) {
      filtered = filtered.filter(alert => !alert.read);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredAlerts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAlerts();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark alert as read');
    }
  };

  const handleMarkAllAsRead = () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all alerts as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          onPress: async () => {
            const unreadAlerts = alerts.filter(alert => !alert.read);
            for (const alert of unreadAlerts) {
              await handleMarkAsRead(alert.id);
            }
          },
        },
      ]
    );
  };

  const getDeviceIcon = (deviceName: string) => {
    switch (deviceName) {
      case 'light':
        return 'lightbulb';
      case 'fan':
        return 'fan';
      case 'speaker':
        return 'speaker';
      default:
        return 'devices';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getCommandDescription = (command: string, device: string) => {
    if (command.includes('off')) {
      return `turned off ${device}`;
    } else if (command.includes('%')) {
      const percentage = command.match(/(\d+)%/)?.[1];
      return `set ${device} to ${percentage}%`;
    } else if (command.includes('on')) {
      return `turned on ${device}`;
    } else {
      return `${command} ${device}`;
    }
  };

  const renderAlert = ({ item }: { item: AlertItem }) => (
    <Card
      style={[
        styles.alertCard,
        !item.read && styles.unreadAlertCard,
        { borderLeftColor: deviceColors[item.device as keyof typeof deviceColors] || theme.colors.primary },
      ]}
    >
      <Card.Content>
        <View style={styles.alertHeader}>
          <View style={styles.alertInfo}>
            <IconButton
              icon={getDeviceIcon(item.device)}
              size={24}
              iconColor={deviceColors[item.device as keyof typeof deviceColors] || theme.colors.primary}
              style={styles.deviceIcon}
            />
            <View style={styles.alertText}>
              <Title style={styles.alertTitle}>
                {item.user} {getCommandDescription(item.command, item.device)}
              </Title>
              <Paragraph style={styles.alertTime}>
                {formatTimestamp(item.timestamp)}
              </Paragraph>
            </View>
          </View>
          <View style={styles.alertActions}>
            {!item.read && (
              <Chip
                mode="flat"
                style={styles.unreadChip}
                textStyle={styles.unreadChipText}
              >
                NEW
              </Chip>
            )}
            {!item.read && (
              <IconButton
                icon="check"
                size={20}
                onPress={() => handleMarkAsRead(item.id)}
                iconColor={theme.colors.primary}
              />
            )}
          </View>
        </View>
        
        <View style={styles.alertDetails}>
          <Chip
            mode="outlined"
            style={styles.deviceChip}
            textStyle={styles.deviceChipText}
          >
            {item.device.toUpperCase()}
          </Chip>
          <Chip
            mode="outlined"
            style={styles.commandChip}
            textStyle={styles.commandChipText}
          >
            {item.command}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconButton
        icon="bell-off"
        size={64}
        iconColor={theme.colors.disabled}
      />
      <Title style={styles.emptyTitle}>
        {showUnreadOnly ? 'No unread alerts' : 'No alerts yet'}
      </Title>
      <Paragraph style={styles.emptyText}>
        {showUnreadOnly
          ? 'All alerts have been read'
          : 'Device alerts will appear here when residents control devices'}
      </Paragraph>
    </View>
  );

  const getUnreadCount = () => alerts.filter(alert => !alert.read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <Title style={styles.headerTitle}>Device Alerts</Title>
          <View style={styles.headerStats}>
            <Chip
              mode="outlined"
              style={styles.totalChip}
              textStyle={styles.totalChipText}
            >
              Total: {alerts.length}
            </Chip>
            {getUnreadCount() > 0 && (
              <Chip
                mode="flat"
                style={styles.unreadCountChip}
                textStyle={styles.unreadCountChipText}
              >
                Unread: {getUnreadCount()}
              </Chip>
            )}
          </View>
        </View>
      </Surface>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search alerts..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterRow}>
          <Button
            mode={showUnreadOnly ? 'contained' : 'outlined'}
            onPress={() => setShowUnreadOnly(!showUnreadOnly)}
            style={styles.filterButton}
            compact
          >
            {showUnreadOnly ? 'Show All' : 'Unread Only'}
          </Button>
          {getUnreadCount() > 0 && (
            <Button
              mode="text"
              onPress={handleMarkAllAsRead}
              style={styles.markAllButton}
              compact
            >
              Mark All Read
            </Button>
          )}
        </View>
      </View>

      {/* Alerts List */}
      <FlatList
        data={filteredAlerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        style={styles.alertsList}
        contentContainerStyle={[
          styles.alertsContent,
          filteredAlerts.length === 0 && styles.emptyAlertsContent,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      {getUnreadCount() > 0 && (
        <FAB
          icon="check-all"
          style={styles.fab}
          onPress={handleMarkAllAsRead}
          label={`Mark ${getUnreadCount()} as read`}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 8,
  },
  totalChip: {
    backgroundColor: theme.colors.surface,
  },
  totalChipText: {
    fontSize: 12,
  },
  unreadCountChip: {
    backgroundColor: theme.colors.error,
  },
  unreadCountChipText: {
    color: 'white',
    fontSize: 12,
  },
  searchSection: {
    padding: 16,
  },
  searchbar: {
    marginBottom: 12,
    elevation: 1,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    flex: 1,
    marginRight: 8,
  },
  markAllButton: {
    flex: 1,
    marginLeft: 8,
  },
  alertsList: {
    flex: 1,
  },
  alertsContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyAlertsContent: {
    flex: 1,
    justifyContent: 'center',
  },
  alertCard: {
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
  },
  unreadAlertCard: {
    backgroundColor: theme.colors.primary + '05',
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  deviceIcon: {
    margin: 0,
    marginRight: 8,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  alertActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadChip: {
    backgroundColor: theme.colors.error,
    marginRight: 4,
    height: 24,
  },
  unreadChipText: {
    color: 'white',
    fontSize: 10,
    lineHeight: 12,
  },
  alertDetails: {
    flexDirection: 'row',
    gap: 8,
  },
  deviceChip: {
    backgroundColor: theme.colors.surface,
    height: 28,
  },
  deviceChipText: {
    fontSize: 11,
    lineHeight: 14,
  },
  commandChip: {
    backgroundColor: theme.colors.accent + '20',
    height: 28,
  },
  commandChipText: {
    fontSize: 11,
    lineHeight: 14,
    color: theme.colors.accent,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: 8,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.5,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default AlertsScreen;
