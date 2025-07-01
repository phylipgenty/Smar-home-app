import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/LoginScreen';
import ResidentDashboard from './src/screens/ResidentDashboard';
import CaretakerDashboard from './src/screens/CaretakerDashboard';
import DeviceControlScreen from './src/screens/DeviceControlScreen';
import ChatScreen from './src/screens/ChatScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { BluetoothProvider } from './src/context/BluetoothContext';

import { theme } from './src/theme/theme';

export type RootStackParamList = {
  Login: undefined;
  ResidentDashboard: undefined;
  CaretakerDashboard: undefined;
  DeviceControl: { device: string };
  Chat: undefined;
  Alerts: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // You can add a loading screen here
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {!user ? (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          {user.role === 'resident' ? (
            <Stack.Screen 
              name="ResidentDashboard" 
              component={ResidentDashboard}
              options={{ title: 'Smart Home Control' }}
            />
          ) : (
            <Stack.Screen 
              name="CaretakerDashboard" 
              component={CaretakerDashboard}
              options={{ title: 'Caretaker Dashboard' }}
            />
          )}
          <Stack.Screen 
            name="DeviceControl" 
            component={DeviceControlScreen}
            options={({ route }) => ({ 
              title: `${route.params.device.charAt(0).toUpperCase() + route.params.device.slice(1)} Control` 
            })}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ title: 'Chat' }}
          />
          <Stack.Screen 
            name="Alerts" 
            component={AlertsScreen}
            options={{ title: 'Alerts' }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <SocketProvider>
          <BluetoothProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </BluetoothProvider>
        </SocketProvider>
      </AuthProvider>
    </PaperProvider>
  );
};

export default App;
