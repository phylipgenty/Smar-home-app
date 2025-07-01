import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Chip,
  IconButton,
  Surface,
  Badge,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { theme, deviceColors, statusColors } from '../theme/theme';
import { RootStackParamList } from '../../App';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const CaretakerDashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();
  const { isConnected, devices, alerts, messages, refreshDevices, refreshAlerts, refreshMessages } = useSocket();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshDevices();
    refreshAlerts();
    refreshMessages();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshDevices(),
      refreshAlerts(),
      refreshMessages(),
    ]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
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

  const getDeviceStatus = (device: any) => {
    if (!device) return 'Unknown';
    if (device.status === 'off') return 'Off';
    return `${device.brightness}% - On`;
  };

  const getUnreadAlertsCount = () => {
    return alerts.filter(alert => !alert.read).length;
  };

  const getRecentMessages = () => {
    return messages.slice(-3); // Get last 3 messages
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderDeviceCard = (deviceName: string, device: any) => (
    <Card
      key={deviceName}
      style={[styles.deviceCard, { borderLeftColor: deviceColors[deviceName as keyof typeof deviceColors] }]}
      onPress={() => navigation.navigate('DeviceControl', { device: deviceName })}
    >
      <Card.Content>
        <View style={styles.deviceHeader}>
          <View style={styles.deviceInfo}>
            <IconButton
              icon={getDeviceIcon(deviceName)}
              size={28}
              iconColor={deviceColors[deviceName as keyof typeof deviceColors]}
            />
            <View>
              <Title style={styles.deviceName}>
                {deviceName.charAt(0).toUpperCase() + deviceName.slice(1)}
              </Title>
              <Paragraph style={styles.deviceStatus}>
                {getDeviceStatus(device)}
              </Paragraph>
            </View>
          </View>
          <Chip
            mode="outlined"
            style={[
              styles.statusChip,
              {
                backgroundColor: device?.status === 'on' ? statusColors.online : statusColors.offline,
              },
            ]}
            textStyle={{ color: 'white', fontSize: 12 }}
          >
            {device?.status === 'on' ? 'ON' : 'OFF'}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  const renderRecentAlert = (alert: any, index: number) => (
    <View key={alert.id} style={styles.alertItem}>
      <View style={styles.alertContent}>
        <IconButton
          icon={getDeviceIcon(alert.device)}
          size={20}
          iconColor={deviceColors[alert.device as keyof typeof deviceColors]}
        />
        <View style={styles.alertText}>
          <Paragraph style={styles.alertMessage}>
            {alert.user} {alert.command} {alert.device}
          </Paragraph>
          <Paragraph style={styles.alertTime}>
            {formatTimestamp(alert.timestamp)}
          </Paragraph>
        </View>
        {!alert.read && (
          <Badge style={styles.unreadBadge} />
        )}
      </View>
    </View>
  );

  const renderRecentMessage = (message: any, index: number) => (
    <View key={message.id} style={styles.messageItem}>
      <View style={styles.messageContent}>
        <Chip
          mode="outlined"
          style={[
            styles.messageRoleChip,
            message.senderRole === 'caretaker' && styles.caretakerChip,
          ]}
          textStyle={styles.messageRoleText}
        >
          {message.sender}
        </Chip>
        <Paragraph style={styles.messageText} numberOfLines={2}>
          {message.text}
        </Paragraph>
        <Paragraph style={styles.messageTime}>
          {formatTimestamp(message.timestamp)}
        </Paragraph>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Title style={styles.welcomeText}>Caretaker Dashboard</Title>
              <Paragraph style={styles.userName}>{user?.name}</Paragraph>
            </View>
            <IconButton
              icon="logout"
              size={24}
              onPress={handleLogout}
              iconColor={theme.colors.primary}
            />
          </View>
        </Surface>

        {/* Connection Status */}
        <Card style={styles.statusCard}>
          <Card.Content>
            <Title style={styles.statusTitle}>System Status</Title>
            <View style={styles.statusRow}>
              <Chip
                icon="wifi"
                style={[
                  styles.connectionChip,
                  { backgroundColor: isConnected ? statusColors.online : statusColors.offline },
                ]}
                textStyle={{ color: 'white' }}
              >
                Server {isConnected ? 'Connected' : 'Disconnected'}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Title style={styles.sectionTitle}>Overview</Title>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <IconButton
                  icon="devices"
                  size={32}
                  iconColor={theme.colors.primary}
                />
                <Title style={styles.statNumber}>{Object.keys(devices).length}</Title>
                <Paragraph style={styles.statLabel}>Devices</Paragraph>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <IconButton
                  icon="alert"
                  size={32}
                  iconColor={theme.colors.warning}
                />
                <Title style={styles.statNumber}>{getUnreadAlertsCount()}</Title>
                <Paragraph style={styles.statLabel}>New Alerts</Paragraph>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <IconButton
                  icon="message"
                  size={32}
                  iconColor={theme.colors.accent}
                />
                <Title style={styles.statNumber}>{messages.length}</Title>
                <Paragraph style={styles.statLabel}>Messages</Paragraph>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Device Status */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Device Status</Title>
          {Object.entries(devices).map(([deviceName, device]) =>
            renderDeviceCard(deviceName, device)
          )}
        </View>

        {/* Recent Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Recent Alerts</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Alerts')}
              compact
            >
              View All
            </Button>
          </View>
          {alerts.slice(0, 3).map(renderRecentAlert)}
          {alerts.length === 0 && (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Paragraph style={styles.emptyText}>No alerts yet</Paragraph>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Recent Messages */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Recent Messages</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Chat')}
              compact
            >
              View Chat
            </Button>
          </View>
          {getRecentMessages().map(renderRecentMessage)}
          {messages.length === 0 && (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Paragraph style={styles.emptyText}>No messages yet</Paragraph>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="message"
        style={styles.fab}
        onPress={() => navigation.navigate('Chat')}
        label={getUnreadAlertsCount() > 0 ? `${getUnreadAlertsCount()}` : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  welcomeText: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    color: theme.colors.text,
    opacity: 0.7,
  },
  statusCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
  },
  connectionChip: {
    flex: 1,
  },
  statsSection: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: theme.colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  section: {
    margin: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceCard: {
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    marginBottom: 4,
  },
  deviceStatus: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusChip: {
    marginLeft: 8,
  },
  alertItem: {
    marginBottom: 8,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 8,
    elevation: 1,
  },
  alertText: {
    flex: 1,
    marginLeft: 8,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '500',
  },
  alertTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  unreadBadge: {
    backgroundColor: theme.colors.error,
    marginLeft: 8,
  },
  messageItem: {
    marginBottom: 8,
  },
  messageContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    elevation: 1,
  },
  messageRoleChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    height: 24,
  },
  caretakerChip: {
    backgroundColor: theme.colors.accent + '20',
  },
  messageRoleText: {
    fontSize: 10,
    lineHeight: 12,
  },
  messageText: {
    fontSize: 14,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyCard: {
    elevation: 1,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.accent,
  },
});

export default CaretakerDashboard;
