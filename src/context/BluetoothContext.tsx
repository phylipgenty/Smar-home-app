import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

// Note: react-native-bluetooth-serial might need to be replaced with
// @react-native-community/bluetooth-serial or react-native-bluetooth-classic
// depending on your React Native version

interface BluetoothDevice {
  id: string;
  name: string;
  address: string;
}

interface BluetoothContextType {
  isEnabled: boolean;
  isConnected: boolean;
  connectedDevice: BluetoothDevice | null;
  availableDevices: BluetoothDevice[];
  isScanning: boolean;
  enableBluetooth: () => Promise<boolean>;
  scanForDevices: () => Promise<void>;
  connectToDevice: (device: BluetoothDevice) => Promise<boolean>;
  disconnect: () => Promise<void>;
  sendCommand: (command: string) => Promise<boolean>;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

export const BluetoothProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    initializeBluetooth();
  }, []);

  const initializeBluetooth = async () => {
    try {
      // Request permissions for Android
      if (Platform.OS === 'android') {
        const granted = await requestBluetoothPermissions();
        if (!granted) {
          console.warn('Bluetooth permissions not granted');
          return;
        }
      }

      // Check if Bluetooth is enabled
      // Note: This is a placeholder - actual implementation depends on the Bluetooth library
      checkBluetoothEnabled();
    } catch (error) {
      console.error('Error initializing Bluetooth:', error);
    }
  };

  const requestBluetoothPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        // For Android 12+ (API level 31+)
        if (Platform.Version >= 31) {
          permissions.push(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
          );
        }

        const results = await PermissionsAndroid.requestMultiple(permissions);
        
        return Object.values(results).every(
          result => result === PermissionsAndroid.RESULTS.GRANTED
        );
      }
      return true; // iOS doesn't need explicit permissions for Bluetooth Classic
    } catch (error) {
      console.error('Error requesting Bluetooth permissions:', error);
      return false;
    }
  };

  const checkBluetoothEnabled = async () => {
    try {
      // Placeholder for actual Bluetooth library implementation
      // const enabled = await BluetoothSerial.isEnabled();
      // setIsEnabled(enabled);
      
      // For now, assume Bluetooth is available
      setIsEnabled(true);
      console.log('Bluetooth status checked');
    } catch (error) {
      console.error('Error checking Bluetooth status:', error);
      setIsEnabled(false);
    }
  };

  const enableBluetooth = async (): Promise<boolean> => {
    try {
      // Placeholder for actual Bluetooth library implementation
      // const enabled = await BluetoothSerial.enable();
      // setIsEnabled(enabled);
      // return enabled;
      
      console.log('Bluetooth enable requested');
      setIsEnabled(true);
      return true;
    } catch (error) {
      console.error('Error enabling Bluetooth:', error);
      return false;
    }
  };

  const scanForDevices = async (): Promise<void> => {
    try {
      setIsScanning(true);
      setAvailableDevices([]);

      // Placeholder for actual Bluetooth library implementation
      // const devices = await BluetoothSerial.discoverUnpairedDevices();
      // const pairedDevices = await BluetoothSerial.list();
      
      // Mock HC-05 device for demonstration
      const mockDevices: BluetoothDevice[] = [
        {
          id: 'hc05_001',
          name: 'HC-05',
          address: '98:D3:31:FB:48:F2'
        }
      ];

      setAvailableDevices(mockDevices);
      console.log('Device scan completed');
    } catch (error) {
      console.error('Error scanning for devices:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device: BluetoothDevice): Promise<boolean> => {
    try {
      console.log(`Attempting to connect to ${device.name} (${device.address})`);
      
      // Placeholder for actual Bluetooth library implementation
      // const connected = await BluetoothSerial.connect(device.address);
      
      // Mock successful connection
      setIsConnected(true);
      setConnectedDevice(device);
      console.log(`Connected to ${device.name}`);
      return true;
    } catch (error) {
      console.error('Error connecting to device:', error);
      setIsConnected(false);
      setConnectedDevice(null);
      return false;
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      // Placeholder for actual Bluetooth library implementation
      // await BluetoothSerial.disconnect();
      
      setIsConnected(false);
      setConnectedDevice(null);
      console.log('Bluetooth disconnected');
    } catch (error) {
      console.error('Error disconnecting Bluetooth:', error);
    }
  };

  const sendCommand = async (command: string): Promise<boolean> => {
    try {
      if (!isConnected || !connectedDevice) {
        console.warn('Bluetooth not connected');
        return false;
      }

      console.log(`Sending command to ${connectedDevice.name}: ${command}`);
      
      // Placeholder for actual Bluetooth library implementation
      // await BluetoothSerial.write(command + '\n');
      
      console.log('Command sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending command:', error);
      return false;
    }
  };

  const value: BluetoothContextType = {
    isEnabled,
    isConnected,
    connectedDevice,
    availableDevices,
    isScanning,
    enableBluetooth,
    scanForDevices,
    connectToDevice,
    disconnect,
    sendCommand,
  };

  return (
    <BluetoothContext.Provider value={value}>
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = (): BluetoothContextType => {
  const context = useContext(BluetoothContext);
  if (context === undefined) {
    throw new Error('useBluetooth must be used within a BluetoothProvider');
  }
  return context;
};
