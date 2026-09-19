import { useNavigate } from "react-router-dom";

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function FriendCard({ entry, isProcessing, onRemove }) {
  const { friend, friendsSince, connectionId } = entry;
  const navigate = useNavigate();

  const handleRemoveClick = () => {
    const confirmed = window.confirm(
      `Remove ${friend.name} from your friends?`
    );

    if (!confirmed) {
      return;
    }

    onRemove(connectionId);
  };

  const handleMessageClick = () => {
    navigate(`/app/chat/${friend.id}`);
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {friend.profileImage ? (
        <img
          src={friend.profileImage}
          alt={friend.name}
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
          {friend.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">
          {friend.name}
        </p>
        <p className="truncate text-xs text-slate-500">{friend.email}</p>
        {friend.bio ? (
          <p className="truncate text-xs text-slate-500">{friend.bio}</p>
        ) : (
          <p className="truncate text-xs text-slate-400 italic">No bio yet</p>
        )}
        <p className="mt-1 text-xs text-slate-400">
          Friends since {formatDate(friendsSince)}
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-1.5">
        <button
          type="button"
          onClick={handleMessageClick}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Message
        </button>
        <button
          type="button"
          onClick={handleRemoveClick}
          disabled={isProcessing}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessing ? "Removing..." : "Remove Friend"}
        </button>
      </div>
    </div>
  );
}