export default function NearbyUserCard({
  user,
  status,
  isProcessing,
  onSendRequest,
  onAccept,
  onReject,
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
        {user.name?.charAt(0)?.toUpperCase() || "?"}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">
          {user.name}
        </p>
        {user.bio ? (
          <p className="truncate text-xs text-slate-500">{user.bio}</p>
        ) : (
          <p className="truncate text-xs text-slate-400 italic">No bio yet</p>
        )}
      </div>

      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
        {user.distanceText}
      </span>

      <div className="shrink-0">
        {status === "friends" && (
          <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
            Friends
          </span>
        )}

        {status === "requestSent" && (
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
            Request Sent
          </span>
        )}

        {status === "requestReceived" && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-medium text-slate-500">
              Respond
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={onAccept}
                className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Accept
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={onReject}
                className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {status === "none" && (
          <button
            type="button"
            disabled={isProcessing}
            onClick={onSendRequest}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing ? "Sending..." : "Add Friend"}
          </button>
        )}
      </div>
    </div>
  );
}