export default function FriendRequestCard({
  request,
  type,
  isProcessing,
  onAccept,
  onReject,
}) {
  const person = type === "received" ? request.sender : request.receiver;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {person.profileImage ? (
        <img
          src={person.profileImage}
          alt={person.name}
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
          {person.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">
          {person.name}
        </p>
        <p className="truncate text-xs text-slate-500">{person.email}</p>
        {person.bio ? (
          <p className="truncate text-xs text-slate-500">{person.bio}</p>
        ) : (
          <p className="truncate text-xs text-slate-400 italic">No bio yet</p>
        )}
      </div>

      <div className="shrink-0">
        {type === "received" && (
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onAccept}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Accept
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={onReject}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Decline
            </button>
          </div>
        )}

        {type === "sent" && (
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
            Pending
          </span>
        )}
      </div>
    </div>
  );
}