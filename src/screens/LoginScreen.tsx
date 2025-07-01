import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';

const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showSnackbar('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(username.trim(), password);
      if (!success) {
        showSnackbar('Invalid credentials. Please try again.');
      }
    } catch (error) {
      showSnackbar('Login failed. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const fillDemoCredentials = (role: 'resident' | 'caretaker') => {
    if (role === 'resident') {
      setUsername('resident1');
      setPassword('password123');
    } else {
      setUsername('caretaker1');
      setPassword('password123');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.title}>Smart Home Control</Title>
              <Paragraph style={styles.subtitle}>
                Sign in to control your smart home devices
              </Paragraph>

              <TextInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                disabled={isLoading}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
                disabled={isLoading}
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.loginButton}
                disabled={isLoading}
                loading={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              <View style={styles.demoSection}>
                <Paragraph style={styles.demoTitle}>Demo Accounts:</Paragraph>
                <View style={styles.demoButtons}>
                  <Button
                    mode="outlined"
                    onPress={() => fillDemoCredentials('resident')}
                    style={styles.demoButton}
                    disabled={isLoading}
                  >
                    Resident
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => fillDemoCredentials('caretaker')}
                    style={styles.demoButton}
                    disabled={isLoading}
                  >
                    Caretaker
                  </Button>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.infoCard}>
            <Card.Content>
              <Title style={styles.infoTitle}>Features</Title>
              <Paragraph style={styles.infoText}>
                • Control lights, fans, and speakers{'\n'}
                • Real-time chat with caretakers{'\n'}
                • Voice and gesture control via Kinect{'\n'}
                • Bluetooth Arduino integration{'\n'}
                • Real-time device status updates
              </Paragraph>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    marginBottom: 20,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: theme.colors.text,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 24,
    paddingVertical: 8,
  },
  demoSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.disabled,
    paddingTop: 16,
  },
  demoTitle: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  demoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  demoButton: {
    flex: 0.4,
  },
  infoCard: {
    elevation: 2,
  },
  infoTitle: {
    color: theme.colors.primary,
    fontSize: 18,
    marginBottom: 8,
  },
  infoText: {
    lineHeight: 20,
    color: theme.colors.text,
    opacity: 0.8,
  },
  snackbar: {
    backgroundColor: theme.colors.error,
  },
});

export default LoginScreen;
