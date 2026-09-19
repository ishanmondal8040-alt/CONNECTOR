import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  fetchChatHistoryApi,
  sendMessageApi,
  markChatReadApi,
  deleteMessageForMeApi,
} from "../../services/messageService";
import { initSocket, getSocket } from "../../services/socket";
import { useAuth } from "../../context/AuthContext";

export default function DirectChatScreen() {
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!friendId) return;

    const setupChat = async () => {
      try {
        const response = await fetchChatHistoryApi(friendId);
        setMessages(response.data.messages || response.data.data || []);
        await markChatReadApi(friendId);

        const socket = await initSocket();

        socket.on("message:receive", (newMessage: any) => {
          if (
            newMessage.senderId === friendId ||
            newMessage.receiverId === friendId
          ) {
            setMessages((prev) => [...prev, newMessage]);
          }
        });
      } catch (error) {
        console.error("Could not load chat history", error);
      } finally {
        setIsLoading(false);
      }
    };

    setupChat();

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off("message:receive");
      }
    };
  }, [friendId]);

  const handleSend = async () => {
    if (!text.trim() || isSending || !friendId) return;

    const messageText = text.trim();
    setText("");
    setIsSending(true);

    try {
      const response = await sendMessageApi(friendId, messageText);
      const newMsg = response.data.data || response.data.message;

      setMessages((prev) => [...prev, newMsg]);
    } catch (error) {
      Alert.alert("Error", "Could not send message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteForMe = async (messageId: string) => {
    try {
      await deleteMessageForMeApi(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (error) {
      Alert.alert("Error", "Could not delete message.");
    }
  };

  const renderMessageItem = ({ item }: { item: any }) => {
    const isMe = item.senderId === user?.id;

    return (
      <TouchableOpacity
        onLongPress={() => {
          Alert.alert("Message Options", "Delete for me?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => handleDeleteForMe(item.id),
            },
          ]);
        }}
        style={[
          styles.msgBubble,
          isMe ? styles.myMsg : styles.theirMsg,
        ]}
      >
        <Text style={[styles.msgText, isMe ? styles.myMsgText : styles.theirMsgText]}>
          {item.text}
        </Text>

        <Text style={[styles.msgTime, isMe ? styles.myMsgTime : styles.theirMsgTime]}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#0f172a" />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.disabledSend]}
          onPress={handleSend}
          disabled={!text.trim() || isSending}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: { marginRight: 12 },
  backText: { fontSize: 14, color: "#0f172a", fontWeight: "600" },
  headerTitle: { fontSize: 16, fontWeight: "bold", color: "#0f172a" },
  msgBubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  myMsg: {
    alignSelf: "flex-end",
    backgroundColor: "#0f172a",
  },
  theirMsg: {
    alignSelf: "flex-start",
    backgroundColor: "#e2e8f0",
  },
  msgText: { fontSize: 14, lineHeight: 20 },
  myMsgText: { color: "#fff" },
  theirMsgText: { color: "#0f172a" },
  msgTime: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  myMsgTime: { color: "#94a3b8" },
  theirMsgTime: { color: "#64748b" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: "#0f172a",
  },
  sendBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginLeft: 8,
  },
  disabledSend: { opacity: 0.5 },
  sendText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});
