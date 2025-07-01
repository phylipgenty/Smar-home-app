import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  IconButton,
  Surface,
  Snackbar,
  ActivityIndicator,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import Slider from 'react-native-slider';

import { useSocket } from '../context/SocketContext';
import { useBluetooth } from '../context/BluetoothContext';
import { theme, deviceColors } from '../theme/theme';
import { RootStackParamList } from '../../App';

type DeviceControlRouteProp = RouteProp<RootStackParamList, 'DeviceControl'>;

const DeviceControlScreen: React.FC = () => {
  const route = useRoute<DeviceControlRouteProp>();
  const navigation = useNavigation();
  const { device: deviceName } = route.params;
  
  const { devices, controlDevice, isConnected } = useSocket();
  const { sendCommand: sendBluetoothCommand, isConnected: bluetoothConnected } = useBluetooth();
  
  const [brightness, setBrightness] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const device = devices[deviceName];

  useEffect(() => {
    if (device) {
      setBrightness(device.brightness || 0);
    }
  }, [device]);

  const getDeviceIcon = () => {
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

  const getDeviceColor = () => {
    return deviceColors[deviceName as keyof typeof deviceColors] || theme.colors.primary;
  };

  const handlePowerToggle = async () => {
    setIsLoading(true);
    try {
      const newCommand = device?.status === 'on' ? 'off' : 'on';
      const newBrightness = newCommand === 'off' ? 0 : 50; // Default to 50% when turning on
      
      const success = await controlDevice(deviceName, newCommand, newBrightness);
      
      if (success) {
        setBrightness(newBrightness);
        showSnackbar(`${deviceName} turned ${newCommand}`);
        Vibration.vibrate(50); // Haptic feedback
      } else {
        showSnackbar('Failed to control device');
      }
    } catch (error) {
      showSnackbar('Error controlling device');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrightnessChange = async (value: number) => {
    setBrightness(value);
  };

  const handleBrightnessComplete = async (value: number) => {
    setIsLoading(true);
    try {
      const command = value === 0 ? 'off' : 'on';
      const success = await controlDevice(deviceName, command, value);
      
      if (success) {
        showSnackbar(`${deviceName} set to ${value}%`);
        Vibration.vibrate(30);
      } else {
        showSnackbar('Failed to update brightness');
        // Revert to previous value
        setBrightness(device?.brightness || 0);
      }
    } catch (error) {
      showSnackbar('Error updating brightness');
      setBrightness(device?.brightness || 0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSet = async (percentage: number) => {
    setIsLoading(true);
    try {
      const command = percentage === 0 ? 'off' : 'on';
      const success = await controlDevice(deviceName, command, percentage);
      
      if (success) {
        setBrightness(percentage);
        showSnackbar(`${deviceName} set to ${percentage}%`);
        Vibration.vibrate(50);
      } else {
        showSnackbar('Failed to set device level');
      }
    } catch (error) {
      showSnackbar('Error setting device level');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectBluetoothCommand = async () => {
    if (!bluetoothConnected) {
      showSnackbar('Bluetooth not connected');
      return;
    }

    try {
      const command = `${deviceName} ${brightness}%`;
      const success = await sendBluetoothCommand(command);
      
      if (success) {
        showSnackbar('Command sent via Bluetooth');
      } else {
        showSnackbar('Failed to send Bluetooth command');
      }
    } catch (error) {
      showSnackbar('Bluetooth command error');
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const isDeviceOn = device?.status === 'on';
  const deviceColor = getDeviceColor();

  return (
    <View style={styles.container}>
      {/* Device Header */}
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon={getDeviceIcon()}
            size={48}
            iconColor={isDeviceOn ? deviceColor : theme.colors.disabled}
            style={[styles.deviceIcon, { backgroundColor: isDeviceOn ? `${deviceColor}20` : 'transparent' }]}
          />
          <View style={styles.deviceInfo}>
            <Title style={styles.deviceTitle}>
              {deviceName.charAt(0).toUpperCase() + deviceName.slice(1)}
            </Title>
            <Paragraph style={styles.deviceStatus}>
              {isDeviceOn ? `${device?.brightness || 0}% - ON` : 'OFF'}
            </Paragraph>
          </View>
        </View>
      </Surface>

      {/* Main Controls */}
      <Card style={styles.controlCard}>
        <Card.Content>
          <Title style={styles.controlTitle}>Power Control</Title>
          
          <View style={styles.powerControl}>
            <Button
              mode={isDeviceOn ? "contained" : "outlined"}
              onPress={handlePowerToggle}
              disabled={isLoading || !isConnected}
              loading={isLoading}
              icon={isDeviceOn ? "power" : "power-off"}
              style={[styles.powerButton, { backgroundColor: isDeviceOn ? deviceColor : 'transparent' }]}
              labelStyle={{ color: isDeviceOn ? 'white' : deviceColor }}
            >
              {isDeviceOn ? 'Turn Off' : 'Turn On'}
            </Button>
          </View>

          {/* Brightness Control */}
          <View style={styles.brightnessSection}>
            <Title style={styles.brightnessTitle}>Brightness / Speed</Title>
            <View style={styles.sliderContainer}>
              <Paragraph style={styles.sliderLabel}>0%</Paragraph>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={10}
                value={brightness}
                onValueChange={handleBrightnessChange}
                onSlidingComplete={handleBrightnessComplete}
                minimumTrackTintColor={deviceColor}
                maximumTrackTintColor={theme.colors.disabled}
                thumbStyle={{ backgroundColor: deviceColor }}
                disabled={isLoading || !isConnected}
              />
              <Paragraph style={styles.sliderLabel}>100%</Paragraph>
            </View>
            <Paragraph style={styles.currentValue}>Current: {brightness}%</Paragraph>
          </View>

          {/* Quick Set Buttons */}
          <View style={styles.quickSetSection}>
            <Title style={styles.quickSetTitle}>Quick Set</Title>
            <View style={styles.quickSetButtons}>
              {[0, 20, 50, 70, 100].map((percentage) => (
                <Button
                  key={percentage}
                  mode={brightness === percentage ? "contained" : "outlined"}
                  onPress={() => handleQuickSet(percentage)}
                  disabled={isLoading || !isConnected}
                  style={[
                    styles.quickSetButton,
                    brightness === percentage && { backgroundColor: deviceColor }
                  ]}
                  labelStyle={{
                    color: brightness === percentage ? 'white' : deviceColor,
                    fontSize: 12,
                  }}
                >
                  {percentage}%
                </Button>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Connection Status & Direct Control */}
      <Card style={styles.statusCard}>
        <Card.Content>
          <Title style={styles.statusTitle}>Connection Status</Title>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Paragraph style={styles.statusLabel}>Server:</Paragraph>
              <Paragraph style={[styles.statusValue, { color: isConnected ? theme.colors.success : theme.colors.error }]}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Paragraph>
            </View>
            <View style={styles.statusItem}>
              <Paragraph style={styles.statusLabel}>Bluetooth:</Paragraph>
              <Paragraph style={[styles.statusValue, { color: bluetoothConnected ? theme.colors.success : theme.colors.error }]}>
                {bluetoothConnected ? 'Connected' : 'Disconnected'}
              </Paragraph>
            </View>
          </View>
          
          {bluetoothConnected && (
            <Button
              mode="outlined"
              onPress={handleDirectBluetoothCommand}
              style={styles.bluetoothButton}
              icon="bluetooth"
            >
              Send Direct Bluetooth Command
            </Button>
          )}
        </Card.Content>
      </Card>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={deviceColor} />
        </View>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  deviceIcon: {
    marginRight: 16,
    borderRadius: 24,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  deviceStatus: {
    fontSize: 16,
    opacity: 0.7,
  },
  controlCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  controlTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  powerControl: {
    alignItems: 'center',
    marginBottom: 24,
  },
  powerButton: {
    paddingHorizontal: 32,
    paddingVertical: 8,
  },
  brightnessSection: {
    marginBottom: 24,
  },
  brightnessTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 12,
    opacity: 0.7,
    width: 30,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  currentValue: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  quickSetSection: {
    marginBottom: 16,
  },
  quickSetTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  quickSetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickSetButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  statusCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  bluetoothButton: {
    marginTop: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  snackbar: {
    backgroundColor: theme.colors.primary,
  },
});

export default DeviceControlScreen;
