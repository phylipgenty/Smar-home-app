import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Switch,
  List,
  Divider,
  IconButton,
  Dialog,
  Portal,
  RadioButton,
  Snackbar,
} from 'react-native-paper';

import { useAuth } from '../context/AuthContext';
import { useBluetooth } from '../context/BluetoothContext';
import { useSocket } from '../context/SocketContext';
import { theme } from '../theme/theme';

const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    isConnected: bluetoothConnected, 
    connectedDevice, 
    availableDevices, 
    connectToDevice, 
    disconnect: disconnectBluetooth,
    scanForDevices 
  } = useBluetooth();
  const { isConnected: serverConnected } = useSocket();

  // User Management (Caretaker only)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('resident');
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Bluetooth Settings
  const [showBluetoothDialog, setShowBluetoothDialog] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // App Settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoConnect, setAutoConnect] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    // Load saved settings
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Load settings from AsyncStorage or context
    // This would be implemented based on your storage strategy
  };

  const saveSettings = async () => {
    // Save settings to AsyncStorage
    showSnackbar('Settings saved');
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword.trim()) {
      showSnackbar('Please fill in all fields');
      return;
    }

    setIsAddingUser(true);
    try {
      // Call API to add new user
      const response = await fetch('http://192.168.1.100:8080/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
        },
        body: JSON.stringify({
          name: newUserName.trim(),
          username: newUserUsername.trim(),
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      if (response.ok) {
        showSnackbar('User added successfully');
        setShowAddUserDialog(false);
        setNewUserName('');
        setNewUserUsername('');
        setNewUserPassword('');
        setNewUserRole('resident');
      } else {
        const error = await response.text();
        showSnackbar(`Failed to add user: ${error}`);
      }
    } catch (error) {
      showSnackbar('Error adding user. Check your connection.');
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleBluetoothScan = async () => {
    setIsScanning(true);
    try {
      await scanForDevices();
      showSnackbar('Scan completed');
    } catch (error) {
      showSnackbar('Failed to scan for devices');
    } finally {
      setIsScanning(false);
    }
  };

  const handleBluetoothConnect = async (deviceId: string) => {
    try {
      const success = await connectToDevice(deviceId);
      if (success) {
        showSnackbar('Connected to Bluetooth device');
        setShowBluetoothDialog(false);
      } else {
        showSnackbar('Failed to connect to device');
      }
    } catch (error) {
      showSnackbar('Bluetooth connection error');
    }
  };

  const handleBluetoothDisconnect = async () => {
    try {
      await disconnectBluetooth();
      showSnackbar('Bluetooth disconnected');
    } catch (error) {
      showSnackbar('Failed to disconnect Bluetooth');
    }
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

  return (
    <ScrollView style={styles.container}>
      {/* User Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>User Information</Title>
          <List.Item
            title={user?.name}
            description={`${user?.role} • ${user?.username}`}
            left={(props) => <List.Icon {...props} icon="account" />}
          />
        </Card.Content>
      </Card>

      {/* Connection Status */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Connection Status</Title>
          <List.Item
            title="Server Connection"
            description={serverConnected ? 'Connected' : 'Disconnected'}
            left={(props) => <List.Icon {...props} icon="wifi" />}
            right={() => (
              <View style={[
                styles.statusIndicator,
                { backgroundColor: serverConnected ? theme.colors.success : theme.colors.error }
              ]} />
            )}
          />
          <List.Item
            title="Bluetooth Connection"
            description={bluetoothConnected ? `Connected to ${connectedDevice?.name}` : 'Disconnected'}
            left={(props) => <List.Icon {...props} icon="bluetooth" />}
            right={() => (
              <View style={[
                styles.statusIndicator,
                { backgroundColor: bluetoothConnected ? theme.colors.success : theme.colors.error }
              ]} />
            )}
            onPress={() => setShowBluetoothDialog(true)}
          />
        </Card.Content>
      </Card>

      {/* User Management (Caretaker Only) */}
      {user?.role === 'caretaker' && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>User Management</Title>
            <Paragraph style={styles.cardDescription}>
              Add new residents to the system
            </Paragraph>
            <Button
              mode="contained"
              onPress={() => setShowAddUserDialog(true)}
              style={styles.actionButton}
              icon="account-plus"
            >
              Add New Resident
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* App Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>App Settings</Title>
          <List.Item
            title="Push Notifications"
            description="Receive alerts and messages"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            )}
          />
          <List.Item
            title="Auto-connect Bluetooth"
            description="Automatically connect to last device"
            left={(props) => <List.Icon {...props} icon="bluetooth-connect" />}
            right={() => (
              <Switch
                value={autoConnect}
                onValueChange={setAutoConnect}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Actions</Title>
          <Button
            mode="outlined"
            onPress={saveSettings}
            style={styles.actionButton}
            icon="content-save"
          >
            Save Settings
          </Button>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={[styles.actionButton, styles.logoutButton]}
            icon="logout"
            textColor={theme.colors.error}
          >
            Logout
          </Button>
        </Card.Content>
      </Card>

      {/* Add User Dialog */}
      <Portal>
        <Dialog visible={showAddUserDialog} onDismiss={() => setShowAddUserDialog(false)}>
          <Dialog.Title>Add New User</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Full Name"
              value={newUserName}
              onChangeText={setNewUserName}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Username"
              value={newUserUsername}
              onChangeText={setNewUserUsername}
              mode="outlined"
              style={styles.dialogInput}
              autoCapitalize="none"
            />
            <TextInput
              label="Password"
              value={newUserPassword}
              onChangeText={setNewUserPassword}
              mode="outlined"
              secureTextEntry
              style={styles.dialogInput}
            />
            <Title style={styles.roleTitle}>Role</Title>
            <RadioButton.Group onValueChange={setNewUserRole} value={newUserRole}>
              <RadioButton.Item label="Resident" value="resident" />
              <RadioButton.Item label="Caretaker" value="caretaker" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddUserDialog(false)}>Cancel</Button>
            <Button
              onPress={handleAddUser}
              loading={isAddingUser}
              disabled={isAddingUser}
            >
              Add User
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Bluetooth Dialog */}
      <Portal>
        <Dialog visible={showBluetoothDialog} onDismiss={() => setShowBluetoothDialog(false)}>
          <Dialog.Title>Bluetooth Settings</Dialog.Title>
          <Dialog.Content>
            {bluetoothConnected && connectedDevice && (
              <View style={styles.connectedDevice}>
                <Paragraph>Connected to: {connectedDevice.name}</Paragraph>
                <Button
                  mode="outlined"
                  onPress={handleBluetoothDisconnect}
                  style={styles.disconnectButton}
                >
                  Disconnect
                </Button>
              </View>
            )}
            
            <Divider style={styles.divider} />
            
            <View style={styles.scanSection}>
              <Button
                mode="contained"
                onPress={handleBluetoothScan}
                loading={isScanning}
                disabled={isScanning}
                style={styles.scanButton}
              >
                {isScanning ? 'Scanning...' : 'Scan for Devices'}
              </Button>
            </View>

            {availableDevices.length > 0 && (
              <View style={styles.devicesList}>
                <Title style={styles.devicesTitle}>Available Devices</Title>
                {availableDevices.map((device) => (
                  <List.Item
                    key={device.id}
                    title={device.name || 'Unknown Device'}
                    description={device.id}
                    left={(props) => <List.Icon {...props} icon="bluetooth" />}
                    onPress={() => handleBluetoothConnect(device.id)}
                  />
                ))}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowBluetoothDialog(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 8,
    color: theme.colors.primary,
  },
  cardDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actionButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  logoutButton: {
    borderColor: theme.colors.error,
  },
  dialogInput: {
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  connectedDevice: {
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginBottom: 16,
  },
  disconnectButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  scanSection: {
    marginBottom: 16,
  },
  scanButton: {
    marginBottom: 8,
  },
  devicesList: {
    marginTop: 8,
  },
  devicesTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
});

export default SettingsScreen;
