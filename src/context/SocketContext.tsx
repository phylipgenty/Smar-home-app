import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface Device {
  status: 'on' | 'off';
  brightness: number;
}

interface Message {
  id: string;
  text: string;
  sender: string;
  senderRole: 'resident' | 'caretaker';
  timestamp: string;
}

interface Alert {
  id: string;
  device: string;
  command: string;
  user: string;
  timestamp: string;
  read?: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  devices: { [key: string]: Device };
  messages: Message[];
  alerts: Alert[];
  sendMessage: (text: string) => void;
  controlDevice: (device: string, command: string, brightness?: number) => Promise<boolean>;
  refreshDevices: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SERVER_URL = 'http://192.168.1.100:8080'; // Replace with your server IP

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState<{ [key: string]: Device }>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (user && token) {
      initializeSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [user, token]);

  const initializeSocket = () => {
    const newSocket = io(SERVER_URL, {
      transports: ['websocket'],
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      
      // Authenticate with server
      newSocket.emit('authenticate', token);
      
      // Load initial data
      refreshDevices();
      refreshMessages();
      if (user?.role === 'caretaker') {
        refreshAlerts();
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('authError', (error) => {
      console.error('Authentication error:', error);
      setIsConnected(false);
    });

    newSocket.on('deviceUpdate', (data: { device: string; state: Device }) => {
      setDevices(prev => ({
        ...prev,
        [data.device]: data.state
      }));
    });

    newSocket.on('newMessage', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('newAlert', (alert: Alert) => {
      setAlerts(prev => [alert, ...prev]);
    });

    newSocket.on('kinectCommandReceived', (data) => {
      console.log('Kinect command received:', data);
      // Handle Kinect commands if needed
    });

    setSocket(newSocket);
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  const sendMessage = (text: string) => {
    if (socket && isConnected) {
      socket.emit('sendMessage', { text });
    }
  };

  const controlDevice = async (device: string, command: string, brightness?: number): Promise<boolean> => {
    try {
      const response = await fetch(`${SERVER_URL}/api/devices/${device}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ command, brightness }),
      });

      if (response.ok) {
        const data = await response.json();
        setDevices(prev => ({
          ...prev,
          [device]: data.device
        }));
        return true;
      } else {
        console.error('Device control failed:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Device control error:', error);
      return false;
    }
  };

  const refreshDevices = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/devices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const devicesData = await response.json();
        setDevices(devicesData);
      }
    } catch (error) {
      console.error('Error refreshing devices:', error);
    }
  };

  const refreshMessages = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  const refreshAlerts = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/alerts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const alertsData = await response.json();
        setAlerts(alertsData);
      }
    } catch (error) {
      console.error('Error refreshing alerts:', error);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    devices,
    messages,
    alerts,
    sendMessage,
    controlDevice,
    refreshDevices,
    refreshMessages,
    refreshAlerts,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
