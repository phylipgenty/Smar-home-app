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
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useBluetooth } from '../context/BluetoothContext';
import { theme, deviceColors, statusColors } from '../theme/theme';
import { RootStackParamList } from '../../App';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ResidentDashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();
  const { isConnected, devices, refreshDevices } = useSocket();
  const { isConnected: bluetoothConnected, connectedDevice } = useBluetooth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshDevices();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshDevices();
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
    return `${device.brightness}%`;
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
              size={32}
              iconColor={deviceColors[deviceName as keyof typeof deviceColors]}
            />
            <View>
              <Title style={styles.deviceName}>
                {deviceName.charAt(0).toUpperCase() + deviceName.slice(1)}
              </Title>
              <Paragraph style={styles.deviceStatus}>
                Status: {getDeviceStatus(device)}
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
              <Title style={styles.welcomeText}>Welcome back,</Title>
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
            <Title style={styles.statusTitle}>Connection Status</Title>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
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
              <View style={styles.statusItem}>
                <Chip
                  icon="bluetooth"
                  style={[
                    styles.connectionChip,
                    { backgroundColor: bluetoothConnected ? statusColors.online : statusColors.offline },
                  ]}
                  textStyle={{ color: 'white' }}
                >
                  Bluetooth {bluetoothConnected ? 'Connected' : 'Disconnected'}
                </Chip>
              </View>
            </View>
            {connectedDevice && (
              <Paragraph style={styles.deviceInfo}>
                Connected to: {connectedDevice.name}
              </Paragraph>
            )}
          </Card.Content>
        </Card>

        {/* Devices */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Smart Devices</Title>
          {Object.entries(devices).map(([deviceName, device]) =>
            renderDeviceCard(deviceName, device)
          )}
          {Object.keys(devices).length === 0 && (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Paragraph style={styles.emptyText}>
                  No devices found. Pull to refresh or check your connection.
                </Paragraph>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Quick Actions</Title>
          <View style={styles.quickActions}>
            <Button
              mode="contained"
              icon="message"
              onPress={() => navigation.navigate('Chat')}
              style={styles.quickActionButton}
            >
              Chat with Caretaker
            </Button>
            <Button
              mode="outlined"
              icon="cog"
              onPress={() => navigation.navigate('Settings')}
              style={styles.quickActionButton}
            >
              Settings
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // Could open a quick device control menu
          Alert.alert(
            'Quick Control',
            'Choose an action',
            [
              { text: 'All Lights Off', onPress: () => {/* Implement */} },
              { text: 'All Devices Off', onPress: () => {/* Implement */} },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}
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
    fontSize: 18,
    color: theme.colors.text,
    opacity: 0.7,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
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
    justifyContent: 'space-between',
  },
  statusItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  connectionChip: {
    width: '100%',
  },
  section: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 12,
    color: theme.colors.primary,
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
    fontSize: 18,
    marginBottom: 4,
  },
  deviceStatus: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusChip: {
    marginLeft: 8,
  },
  emptyCard: {
    elevation: 1,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
  },
  quickActions: {
    gap: 12,
  },
  quickActionButton: {
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default ResidentDashboard;
