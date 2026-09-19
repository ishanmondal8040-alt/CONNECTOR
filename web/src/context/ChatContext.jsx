import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useMatch } from "react-router-dom";
import toast from "react-hot-toast";
import {
  fetchConversationsApi,
  markChatAsReadApi,
} from "../services/messageService";
import { connectSocket, disconnectSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { isAuthenticated, user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState(null);

  const [onlineUserIds, setOnlineUserIds] = useState(new Set());

  const notifiedMessageIds = useRef(new Set());

  const activeChatMatch = useMatch("/app/chat/:friendId");
  const activeChatMatchRef = useRef(activeChatMatch);

  useEffect(() => {
    activeChatMatchRef.current = activeChatMatch;
  }, [activeChatMatch]);

  const refreshConversations = useCallback(async () => {
    try {
      const response = await fetchConversationsApi();

      setConversations(response.data.conversations || []);
      setConversationsError(null);
    } catch (error) {
      setConversationsError(
        error.response?.data?.message || "Could not load conversations."
      );
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    notifiedMessageIds.current.clear();

    if (!isAuthenticated) {
      disconnectSocket();
      setConversations([]);
      setOnlineUserIds(new Set());
      setIsLoadingConversations(true);
      return undefined;
    }

    refreshConversations();

    const socket = connectSocket();

    if (!socket) {
      return undefined;
    }

    const handleReceive = async (message) => {
      const viewingFriendId =
        activeChatMatchRef.current?.params?.friendId;

      if (viewingFriendId === message.senderId) {
        try {
          await markChatAsReadApi(message.senderId);
        } catch {
          // Chat can continue even if marking as read fails.
        }

        await refreshConversations();
        return;
      }

      await refreshConversations();

      if (message.senderId === user?.id) {
        return;
      }

      if (notifiedMessageIds.current.has(message.id)) {
        return;
      }

      notifiedMessageIds.current.add(message.id);

      toast(
        `New message from ${message.sender?.name || "someone"}`
      );
    };

    const handleOnlineUsers = (userIds) => {
      if (Array.isArray(userIds)) {
        setOnlineUserIds(new Set(userIds));
      }
    };

    socket.on("message:receive", handleReceive);
    socket.on("online-users", handleOnlineUsers);

    return () => {
      socket.off("message:receive", handleReceive);
      socket.off("online-users", handleOnlineUsers);
      disconnectSocket();
    };
  }, [isAuthenticated, refreshConversations, user?.id]);

  const totalUnreadCount = conversations.reduce(
    (total, conversation) =>
      total + (conversation.unreadCount || 0),
    0
  );

  const isUserOnline = useCallback(
    (userId) => onlineUserIds.has(userId),
    [onlineUserIds]
  );

  const value = {
    conversations,
    isLoadingConversations,
    conversationsError,
    totalUnreadCount,
    refreshConversations,
    onlineUserIds,
    isUserOnline,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error(
      "useChat must be used within a ChatProvider"
    );
  }

  return context;
}