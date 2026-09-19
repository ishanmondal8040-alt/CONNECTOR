import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { fetchConversationsApi } from "../../../services/messageService";

export default function ChatListScreen() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetchConversationsApi();
      setConversations(response.data.conversations || response.data.data || []);
    } catch (error) {
      console.error("Could not load conversations", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const renderItem = ({ item }: { item: any }) => {
    const friend = item.friend;
    const lastMessage = item.lastMessage;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(/chat/ + friend.id)}
      >
        {friend?.profileImage ? (
          <Image source={{ uri: friend.profileImage }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {friend?.name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        )}

        <View style={styles.infoContainer}>
          <View style={styles.topRow}>
            <Text style={styles.name}>{friend?.name}</Text>
            {lastMessage?.createdAt && (
              <Text style={styles.time}>
                {new Date(lastMessage.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            )}
          </View>

          <Text style={styles.lastMsg} numberOfLines={1}>
            {lastMessage?.text || "No messages yet"}
          </Text>
        </View>

        {item.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Chats</Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} size="large" color="#0f172a" />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.friend?.id || Math.random().toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                loadConversations();
              }}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No active conversations found.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#0f172a", marginBottom: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 1,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justify: "center",
  },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  infoContainer: { flex: 1, marginLeft: 12 },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  name: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  time: { fontSize: 11, color: "#94a3b8" },
  lastMsg: { fontSize: 13, color: "#64748b" },
  badge: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justify: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  emptyText: { textAlign: "center", color: "#94a3b8", marginTop: 40, fontSize: 14 },
});
