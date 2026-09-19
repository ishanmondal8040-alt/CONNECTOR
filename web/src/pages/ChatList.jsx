import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useChat } from "../context/ChatContext";

function formatTime(dateString) {
  if (!dateString) {
    return "";
  }

  return new Date(dateString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatList() {
  const {
    conversations,
    isLoadingConversations,
    conversationsError,
    refreshConversations,
  } = useChat();

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-lg font-semibold text-slate-900">Chat</h1>

      <div className="mt-4">
        {isLoadingConversations && (
          <p className="text-sm text-slate-500">Loading conversations...</p>
        )}

        {!isLoadingConversations && conversationsError && (
          <p className="text-sm text-red-600">{conversationsError}</p>
        )}

        {!isLoadingConversations &&
          !conversationsError &&
          conversations.length === 0 && (
            <p className="text-sm text-slate-500">
              No conversations yet. Message a friend to get started.
            </p>
          )}

        {!isLoadingConversations && conversations.length > 0 && (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Link
                key={conversation.user.id}
                to={`/app/chat/${conversation.user.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
              >
                {conversation.user.profileImage ? (
                  <img
                    src={conversation.user.profileImage}
                    alt={conversation.user.name}
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {conversation.user.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {conversation.user.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {conversation.lastMessage.content}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-slate-400">
                    {formatTime(conversation.lastMessage.createdAt)}
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}