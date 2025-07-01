import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  IconButton,
  Card,
  Paragraph,
  Chip,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';

import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { theme } from '../theme/theme';

interface Message {
  id: string;
  text: string;
  sender: string;
  senderRole: 'resident' | 'caretaker';
  timestamp: string;
}

const ChatScreen: React.FC = () => {
  const { user } = useAuth();
  const { messages, sendMessage, isConnected, refreshMessages } = useSocket();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    // Load messages when component mounts
    refreshMessages();
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim()) {
      return;
    }

    if (!isConnected) {
      Alert.alert('Connection Error', 'Not connected to server. Please check your connection.');
      return;
    }

    setIsLoading(true);
    try {
      sendMessage(inputText.trim());
      setInputText('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderRole === user?.role;
    const isFromCaretaker = item.senderRole === 'caretaker';

    return (
      <View style={[styles.messageContainer, isMyMessage && styles.myMessageContainer]}>
        <Card
          style={[
            styles.messageCard,
            isMyMessage ? styles.myMessageCard : styles.otherMessageCard,
            isFromCaretaker && !isMyMessage && styles.caretakerMessageCard,
          ]}
        >
          <Card.Content style={styles.messageContent}>
            {!isMyMessage && (
              <View style={styles.senderInfo}>
                <Chip
                  mode="outlined"
                  style={[
                    styles.senderChip,
                    isFromCaretaker && styles.caretakerChip,
                  ]}
                  textStyle={[
                    styles.senderChipText,
                    isFromCaretaker && styles.caretakerChipText,
                  ]}
                >
                  {item.sender}
                </Chip>
              </View>
            )}
            <Paragraph
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.otherMessageText,
              ]}
            >
              {item.text}
            </Paragraph>
            <Paragraph
              style={[
                styles.timestamp,
                isMyMessage ? styles.myTimestamp : styles.otherTimestamp,
              ]}
            >
              {formatTimestamp(item.timestamp)}
            </Paragraph>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Paragraph style={styles.emptyText}>
        No messages yet. Start a conversation!
      </Paragraph>
      {user?.role === 'resident' && (
        <Paragraph style={styles.emptySubtext}>
          Send a message to get help from caretakers.
        </Paragraph>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Connection Status */}
      <Surface style={styles.statusBar}>
        <View style={styles.statusContent}>
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? theme.colors.success : theme.colors.error },
              ]}
            />
            <Paragraph style={styles.statusText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Paragraph>
          </View>
          {user?.role === 'resident' && (
            <Chip
              mode="outlined"
              style={styles.roleChip}
              textStyle={styles.roleChipText}
            >
              Chatting with Caretakers
            </Chip>
          )}
        </View>
      </Surface>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={[
          styles.messagesContent,
          messages.length === 0 && styles.emptyMessagesContent,
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
      />

      {/* Input Area */}
      <Surface style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              user?.role === 'resident'
                ? 'Type your message to caretakers...'
                : 'Type your response...'
            }
            mode="outlined"
            style={styles.textInput}
            multiline
            maxLength={500}
            disabled={!isConnected || isLoading}
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={false}
          />
          <IconButton
            icon="send"
            size={24}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || !isConnected || isLoading}
            iconColor={
              inputText.trim() && isConnected && !isLoading
                ? theme.colors.primary
                : theme.colors.disabled
            }
            style={styles.sendButton}
          />
        </View>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Paragraph style={styles.loadingText}>Sending...</Paragraph>
          </View>
        )}
      </Surface>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statusBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 1,
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  roleChip: {
    backgroundColor: theme.colors.primary + '20',
  },
  roleChipText: {
    color: theme.colors.primary,
    fontSize: 12,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  emptyMessagesContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.7,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.5,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  messageCard: {
    elevation: 1,
  },
  myMessageCard: {
    backgroundColor: theme.colors.primary,
  },
  otherMessageCard: {
    backgroundColor: theme.colors.surface,
  },
  caretakerMessageCard: {
    backgroundColor: theme.colors.accent + '20',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent,
  },
  messageContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  senderInfo: {
    marginBottom: 4,
  },
  senderChip: {
    alignSelf: 'flex-start',
    height: 24,
  },
  caretakerChip: {
    backgroundColor: theme.colors.accent + '20',
  },
  senderChipText: {
    fontSize: 10,
    lineHeight: 12,
  },
  caretakerChipText: {
    color: theme.colors.accent,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  myTimestamp: {
    color: 'white',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: theme.colors.text,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    margin: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    opacity: 0.7,
  },
});

export default ChatScreen;
