import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import {
  fetchChatHistoryApi,
  sendMessageApi,
  markChatAsReadApi,
  reactToMessageApi,
  editMessageApi,
  deleteMessageForMeApi,
} from "../services/messageService";
import { connectSocket } from "../services/socket";

const TYPING_STOP_DELAY_MS = 1500;
const EMOJI_OPTIONS = ["😀", "😂", "❤️", "👍", "😮", "😢", "🎉", "🔥"];
const REACTION_OPTIONS = ["👍", "❤️", "😂", "😮", "😢"];

function formatLastSeen(dateString) {
  if (!dateString) {
    return null;
  }

  return new Date(dateString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMessageTime(dateString) {
  if (!dateString) {
    return "";
  }

  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupReactions(reactions) {
  if (!Array.isArray(reactions) || reactions.length === 0) {
    return [];
  }

  const groups = new Map();

  for (const reaction of reactions) {
    if (!groups.has(reaction.emoji)) {
      groups.set(reaction.emoji, []);
    }
    groups.get(reaction.emoji).push(reaction);
  }

  return Array.from(groups.entries()).map(([emoji, list]) => ({
    emoji,
    count: list.length,
    userIds: list.map((r) => r.userId),
  }));
}

export default function Chat() {
  const { friendId } = useParams();
  const { user } = useAuth();
  const { refreshConversations, isUserOnline } = useChat();

  const [chatWith, setChatWith] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);

  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const savingEditRef = useRef(false);

  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deletingRef = useRef(false);

  const isTypingRef = useRef(false);
  const typingStopTimeoutRef = useRef(null);

  const bottomRef = useRef(null);
  const isMountedRef = useRef(true);
  const inputRef = useRef(null);
  const emojiPickerContainerRef = useRef(null);
  const reactionPickerContainerRef = useRef(null);

  const isFriendOnline = isUserOnline(friendId);

  const previousOnlineRef = useRef(null);
  const previousFriendIdRef = useRef(friendId);
  const lastSeenRequestTokenRef = useRef(0);

  const appendMessageIfNew = (message) => {
    setMessages((prev) => {
      if (prev.some((existing) => existing.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  };

  const applyDeliveredUpdate = (messageId, deliveredAt) => {
    setMessages((prev) =>
      prev.map((existing) =>
        existing.id === messageId
          ? { ...existing, isDelivered: true, deliveredAt }
          : existing
      )
    );
  };

  const applySeenUpdate = (readAt) => {
    setMessages((prev) =>
      prev.map((existing) =>
        existing.senderId === user?.id && existing.receiverId === friendId
          ? { ...existing, isRead: true, readAt }
          : existing
      )
    );
  };

  const applyReactionsUpdate = (messageId, reactions) => {
    setMessages((prev) =>
      prev.map((existing) =>
        existing.id === messageId ? { ...existing, reactions } : existing
      )
    );
  };

  // Handles both the REST-success path (a full updated message is
  // available) and the socket path (only messageId/content/editedAt are
  // available). Either way, also patches replyTo.content on any other
  // currently-visible message that quotes this one, so a quoted preview
  // never goes stale without a refresh.
  const applyEditUpdate = (messageId, content, editedAt, fullMessage) => {
    setMessages((prev) =>
      prev.map((existing) => {
        if (existing.id === messageId) {
          return fullMessage || { ...existing, content, editedAt };
        }
        if (existing.replyTo?.id === messageId) {
          return {
            ...existing,
            replyTo: { ...existing.replyTo, content },
          };
        }
        return existing;
      })
    );
  };

  // Clears any interaction state that was pointing at a message which no
  // longer exists in this user's view (after a delete-for-me).
  const clearRelatedStateFor = (messageId) => {
    setReplyTarget((prev) => (prev?.id === messageId ? null : prev));
    setEditingMessageId((prev) => (prev === messageId ? null : prev));
    setReactionPickerMessageId((prev) =>
      prev === messageId ? null : prev
    );
  };

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetchChatHistoryApi(friendId);
      setChatWith(response.data.chatWith);
      setMessages(response.data.messages);

      try {
        await markChatAsReadApi(friendId);
        refreshConversations();
      } catch {
        // Marking as read is best-effort; failing here should not block
        // viewing the conversation, which already loaded successfully.
      }
    } catch (error) {
      setLoadError(
        error.response?.data?.message || "Could not load this conversation."
      );
    } finally {
      setIsLoading(false);
    }
  }, [friendId, refreshConversations]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setReplyTarget(null);
    setReactionPickerMessageId(null);
    setEditingMessageId(null);
    setEditDraft("");
    setDeleteTargetId(null);
  }, [friendId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!isFriendOnline) {
      setIsFriendTyping(false);
    }
  }, [isFriendOnline]);

  useEffect(() => {
    if (previousFriendIdRef.current !== friendId) {
      previousFriendIdRef.current = friendId;
      previousOnlineRef.current = null;
    }

    const wasOnline = previousOnlineRef.current;
    previousOnlineRef.current = isFriendOnline;

    if (wasOnline !== true || isFriendOnline !== false) {
      return;
    }

    const requestId = ++lastSeenRequestTokenRef.current;

    fetchChatHistoryApi(friendId)
      .then((response) => {
        if (!isMountedRef.current) {
          return;
        }
        if (requestId !== lastSeenRequestTokenRef.current) {
          return;
        }
        if (previousFriendIdRef.current !== friendId) {
          return;
        }

        setChatWith(response.data.chatWith);
      })
      .catch(() => {
        // Best-effort: on failure the header simply keeps showing
        // whatever lastSeenAt it already had.
      });
  }, [isFriendOnline, friendId]);

  useEffect(() => {
    const socket = connectSocket();

    if (!socket) {
      return undefined;
    }

    const handleReceive = (message) => {
      if (message.senderId === friendId) {
        appendMessageIfNew(message);
      }
    };

    const handleTypingReceive = ({ senderId, isTyping }) => {
      if (senderId !== friendId) {
        return;
      }
      setIsFriendTyping(isTyping);
    };

    const handleDelivered = ({ messageId, deliveredAt }) => {
      applyDeliveredUpdate(messageId, deliveredAt);
    };

    const handleSeen = ({ readerId, readAt }) => {
      if (readerId !== friendId) {
        return;
      }
      applySeenUpdate(readAt);
    };

    const handleReaction = ({ messageId, reactions }) => {
      applyReactionsUpdate(messageId, reactions);
    };

    const handleEdited = ({ messageId, content, editedAt }) => {
      applyEditUpdate(messageId, content, editedAt);
    };

    socket.on("message:receive", handleReceive);
    socket.on("typing:receive", handleTypingReceive);
    socket.on("message:delivered", handleDelivered);
    socket.on("message:seen", handleSeen);
    socket.on("message:reaction", handleReaction);
    socket.on("message:edited", handleEdited);

    return () => {
      socket.off("message:receive", handleReceive);
      socket.off("typing:receive", handleTypingReceive);
      socket.off("message:delivered", handleDelivered);
      socket.off("message:seen", handleSeen);
      socket.off("message:reaction", handleReaction);
      socket.off("message:edited", handleEdited);

      if (isTypingRef.current) {
        socket.emit("typing:stop", { receiverId: friendId });
        isTypingRef.current = false;
      }
      clearTimeout(typingStopTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendId, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      setIsEmojiPickerOpen(false);
    };
  }, []);

  useEffect(() => {
    if (!isEmojiPickerOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (
        emojiPickerContainerRef.current &&
        !emojiPickerContainerRef.current.contains(event.target)
      ) {
        setIsEmojiPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEmojiPickerOpen]);

  useEffect(() => {
    if (!reactionPickerMessageId) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (
        reactionPickerContainerRef.current &&
        !reactionPickerContainerRef.current.contains(event.target)
      ) {
        setReactionPickerMessageId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [reactionPickerMessageId]);

  const handleDraftChange = (event) => {
    const value = event.target.value;
    setDraft(value);

    const socket = connectSocket();

    if (!socket) {
      return;
    }

    if (value.trim().length === 0) {
      clearTimeout(typingStopTimeoutRef.current);

      if (isTypingRef.current) {
        isTypingRef.current = false;
        socket.emit("typing:stop", { receiverId: friendId });
      }

      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing:start", { receiverId: friendId });
    }

    clearTimeout(typingStopTimeoutRef.current);
    typingStopTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("typing:stop", { receiverId: friendId });
    }, TYPING_STOP_DELAY_MS);
  };

  const stopTypingNow = () => {
    clearTimeout(typingStopTimeoutRef.current);

    if (isTypingRef.current) {
      const socket = connectSocket();
      socket?.emit("typing:stop", { receiverId: friendId });
      isTypingRef.current = false;
    }
  };

  const handleEmojiSelect = (emoji) => {
    const input = inputRef.current;

    if (!input) {
      setDraft((prev) => prev + emoji);
      setIsEmojiPickerOpen(false);
      return;
    }

    const start = input.selectionStart ?? draft.length;
    const end = input.selectionEnd ?? draft.length;
    const nextValue = draft.slice(0, start) + emoji + draft.slice(end);
    const nextCursor = start + emoji.length;

    setDraft(nextValue);
    setIsEmojiPickerOpen(false);

    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleReplyClick = (message) => {
    if (!message?.id) {
      return;
    }
    setReplyTarget({
      id: message.id,
      senderId: message.senderId,
      content: message.content,
    });
  };

  const handleCancelReply = () => {
    setReplyTarget(null);
  };

  const handleReactionButtonClick = (messageId) => {
    setReactionPickerMessageId((prev) =>
      prev === messageId ? null : messageId
    );
  };

  const handleReactionSelect = async (messageId, emoji) => {
    setReactionPickerMessageId(null);

    try {
      const response = await reactToMessageApi(messageId, emoji);
      applyReactionsUpdate(messageId, response.data.reactions);
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not update reaction.";
      toast.error(message);
    }
  };

  const handleCopyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Message copied");
    } catch {
      toast.error("Could not copy message");
    }
  };

  const handleEditClick = (message) => {
    if (message.senderId !== user?.id) {
      return;
    }
    setEditingMessageId(message.id);
    setEditDraft(message.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditDraft("");
  };

  const handleSaveEdit = async (messageId) => {
    const content = editDraft.trim();

    if (!content) {
      toast.error("Message cannot be empty.");
      return;
    }

    if (savingEditRef.current) {
      return;
    }

    savingEditRef.current = true;
    setIsSavingEdit(true);

    try {
      const response = await editMessageApi(messageId, content);
      const updatedMessage = response.data.data;
      applyEditUpdate(
        updatedMessage.id,
        updatedMessage.content,
        updatedMessage.editedAt,
        updatedMessage
      );

      refreshConversations();

      setEditingMessageId(null);
      setEditDraft("");
      toast.success("Message edited");
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not edit message.";
      toast.error(message);
    } finally {
      savingEditRef.current = false;
      setIsSavingEdit(false);
    }
  };

  const handleEditKeyDown = (event, messageId) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSaveEdit(messageId);
    } else if (event.key === "Escape") {
      event.preventDefault();
      handleCancelEdit();
    }
  };

  const handleDeleteClick = (message) => {
    if (!message?.id) {
      return;
    }
    setDeleteTargetId(message.id);
  };

  const handleCancelDelete = () => {
    setDeleteTargetId(null);
  };

  const handleConfirmDelete = async (messageId) => {
    if (deletingRef.current) {
      return;
    }

    deletingRef.current = true;
    setIsDeleting(true);

    try {
      await deleteMessageForMeApi(messageId);

setMessages((prev) =>
  prev
    .filter((m) => m.id !== messageId)
    .map((m) =>
      m.replyTo?.id === messageId
        ? {
            ...m,
            replyTo: {
              ...m.replyTo,
              content: null,
              deletedForViewer: true,
            },
          }
        : m
    )
);
      clearRelatedStateFor(messageId);
      setDeleteTargetId(null);

      refreshConversations();

      toast.success("Message deleted for you");
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not delete message.";
      toast.error(message);
    } finally {
      deletingRef.current = false;
      setIsDeleting(false);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();

    const content = draft.trim();

    if (!content || sendingRef.current) {
      return;
    }

    stopTypingNow();
    setIsEmojiPickerOpen(false);

    sendingRef.current = true;
    setIsSending(true);

    try {
      const response = await sendMessageApi(
        friendId,
        content,
        replyTarget?.id
      );
      appendMessageIfNew(response.data.data);
      setDraft("");
      setReplyTarget(null);
      refreshConversations();
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not send message.";
      toast.error(message);
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-slate-500">Loading conversation...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-red-600">{loadError}</p>
        <Link
          to="/app/friends"
          className="mt-4 inline-block text-sm font-medium text-slate-900 hover:underline"
        >
          Back to Friends
        </Link>
      </div>
    );
  }

  const lastOwnMessage = [...messages]
    .reverse()
    .find((message) => message.senderId === user?.id);

  const lastOwnMessageStatus = (() => {
    if (!lastOwnMessage) {
      return null;
    }
    if (lastOwnMessage.isRead) {
      return "Seen";
    }
    if (lastOwnMessage.isDelivered) {
      return "Delivered";
    }
    return null;
  })();

  const lastSeenText = formatLastSeen(chatWith?.lastSeenAt);

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col px-4 py-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="relative shrink-0">
          {chatWith?.profileImage ? (
            <img
              src={chatWith.profileImage}
              alt={chatWith.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {chatWith?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
          {isFriendOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-slate-900">
            {chatWith?.name}
          </h1>
          <p className="text-xs text-slate-500">
            {isFriendOnline
              ? "Online"
              : lastSeenText
              ? `Last seen ${lastSeenText}`
              : ""}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            No messages yet. Say hello!
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => {
              const isOwnMessage = message.senderId === user?.id;
              const isReplyTargetActive = replyTarget?.id === message.id;
              const isReactionPickerOpen =
                reactionPickerMessageId === message.id;
              const isEditingThis = editingMessageId === message.id;
              const isDeleteConfirmOpen = deleteTargetId === message.id;
              const reactionGroups = groupReactions(message.reactions);

              return (
                <div
                  key={message.id}
                  className={
                    isReplyTargetActive
                      ? "rounded-xl ring-2 ring-blue-400 ring-offset-2"
                      : ""
                  }
                >
                  <div
                    className={`flex ${
                      isOwnMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                        isOwnMessage
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      {message.replyTo && (
                        <div
                          className={`mb-1.5 rounded-md border-l-4 px-2 py-1 text-xs italic ${
                            isOwnMessage
                              ? "border-blue-300 bg-slate-800 text-slate-300"
                              : "border-blue-400 bg-slate-200 text-slate-600"
                          }`}
                        >
                          <p className="font-semibold not-italic">
                            {message.replyTo.senderId === user?.id
                              ? "You"
                              : chatWith?.name}
                          </p>
                          <p className="line-clamp-2">
                            {message.replyTo.deletedForViewer
                              ? "Original message unavailable"
                              : message.replyTo.content}
                          </p>
                        </div>
                      )}

                      {isEditingThis ? (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={editDraft}
                            onChange={(event) =>
                              setEditDraft(event.target.value)
                            }
                            onKeyDown={(event) =>
                              handleEditKeyDown(event, message.id)
                            }
                            autoFocus
                            className={`rounded-md px-2 py-1 text-sm outline-none ${
                              isOwnMessage
                                ? "bg-slate-800 text-white ring-1 ring-slate-500"
                                : "bg-white text-slate-900 ring-1 ring-slate-300"
                            }`}
                          />
                          <div className="flex justify-end gap-2 text-xs">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className={
                                isOwnMessage
                                  ? "text-slate-300 hover:text-white"
                                  : "text-slate-500 hover:text-slate-700"
                              }
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(message.id)}
                              disabled={isSavingEdit || !editDraft.trim()}
                              className={`font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                                isOwnMessage
                                  ? "text-white"
                                  : "text-slate-900"
                              }`}
                            >
                              {isSavingEdit ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>

                  {isDeleteConfirmOpen && (
                    <div
                      className={`mt-1 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span className="text-red-700">
                        Delete this message for you?
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelDelete}
                        className="font-medium text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(message.id)}
                        disabled={isDeleting}
                        className="font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}

                  {!isEditingThis &&
                    !isDeleteConfirmOpen &&
                    reactionGroups.length > 0 && (
                      <div
                        className={`mt-1 flex flex-wrap gap-1 ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        {reactionGroups.map((group) => {
                          const didUserReact = group.userIds.includes(
                            user?.id
                          );

                          return (
                            <button
                              key={group.emoji}
                              type="button"
                              onClick={() =>
                                handleReactionSelect(message.id, group.emoji)
                              }
                              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
                                didUserReact
                                  ? "border-blue-400 bg-blue-50 text-blue-700"
                                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <span>{group.emoji}</span>
                              <span>{group.count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                  {!isEditingThis && !isDeleteConfirmOpen && (
                    <div
                      className={`mt-0.5 flex items-center gap-2 text-[10px] text-slate-400 ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span>
                        {formatMessageTime(message.createdAt)}
                        {message.editedAt ? " · Edited" : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleReplyClick(message)}
                        className="font-medium text-slate-400 hover:text-slate-600"
                      >
                        Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(message)}
                        className="font-medium text-slate-400 hover:text-slate-600"
                      >
                        Copy
                      </button>
                      {isOwnMessage && (
                        <button
                          type="button"
                          onClick={() => handleEditClick(message)}
                          className="font-medium text-slate-400 hover:text-slate-600"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(message)}
                        className="font-medium text-slate-400 hover:text-slate-600"
                      >
                        Delete
                      </button>
                      <div
                        className="relative"
                        ref={
                          isReactionPickerOpen
                            ? reactionPickerContainerRef
                            : null
                        }
                      >
                        <button
                          type="button"
                          onClick={() => handleReactionButtonClick(message.id)}
                          className="font-medium text-slate-400 hover:text-slate-600"
                        >
                          React
                        </button>

                        {isReactionPickerOpen && (
                          <div
                            className={`absolute z-10 mt-1 flex gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg ${
                              isOwnMessage ? "right-0" : "left-0"
                            }`}
                          >
                            {REACTION_OPTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() =>
                                  handleReactionSelect(message.id, emoji)
                                }
                                className="rounded-lg p-1 text-base transition hover:bg-slate-100"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!isEditingThis &&
                    !isDeleteConfirmOpen &&
                    isOwnMessage &&
                    lastOwnMessage &&
                    message.id === lastOwnMessage.id &&
                    lastOwnMessageStatus && (
                      <p className="text-right text-xs text-slate-400">
                        {lastOwnMessageStatus}
                      </p>
                    )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="h-5 px-1 text-xs text-slate-500">
        {isFriendTyping ? `${chatWith?.name || "They"} is typing...` : ""}
      </div>

      {replyTarget && (
        <div className="flex items-start justify-between rounded-lg border-l-4 border-blue-500 bg-blue-50 px-3 py-2 text-xs">
          <div className="min-w-0">
            <p className="font-semibold text-blue-700">
              Replying to{" "}
              {replyTarget.senderId === user?.id ? "You" : chatWith?.name}
            </p>
            <p className="line-clamp-2 text-slate-600">
              {replyTarget.content}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancelReply}
            className="ml-2 shrink-0 rounded-full p-1 text-slate-400 hover:bg-blue-100 hover:text-slate-700"
            aria-label="Cancel reply"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-200 pt-4">
        <div className="relative" ref={emojiPickerContainerRef}>
          <button
            type="button"
            onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
            aria-label="Insert emoji"
          >
            😊
          </button>

          {isEmojiPickerOpen && (
            <div className="absolute bottom-full left-0 mb-2 grid grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiSelect(emoji)}
                  className="rounded-lg p-1.5 text-lg transition hover:bg-slate-100"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={handleDraftChange}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}