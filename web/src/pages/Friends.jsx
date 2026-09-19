import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  fetchFriendsApi,
  fetchPendingRequestsApi,
  fetchSentRequestsApi,
  acceptFriendRequestApi,
  rejectFriendRequestApi,
} from "../services/friendService";

const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.friends)) return data.friends;
  if (data && Array.isArray(data.requests)) return data.requests;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [friendsRes, incomingRes, sentRes] = await Promise.all([
        fetchFriendsApi().catch(() => ({ data: [] })),
        fetchPendingRequestsApi().catch(() => ({ data: [] })),
        fetchSentRequestsApi().catch(() => ({ data: [] })),
      ]);

      setFriends(ensureArray(friendsRes?.data));
      setIncomingRequests(ensureArray(incomingRes?.data));
      setSentRequests(ensureArray(sentRes?.data));
    } catch (error) {
      toast.error("Could not load friends data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const safeFriends = ensureArray(friends);
  const safeIncoming = ensureArray(incomingRequests);
  const safeSent = ensureArray(sentRequests);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Friends & Requests</h1>

      {isLoading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">
              Friends ({safeFriends.length})
            </h2>
            {safeFriends.length === 0 ? (
              <p className="text-sm text-slate-500">No friends added yet.</p>
            ) : (
              <div className="space-y-2">
                {safeFriends.map((f) => (
                  <div key={f.id} className="p-3 bg-white rounded-lg border flex justify-between items-center">
                    <span>{f.friend?.name || f.name || "User"}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">
              Pending Requests ({safeIncoming.length})
            </h2>
            {safeIncoming.length === 0 ? (
              <p className="text-sm text-slate-500">No pending requests.</p>
            ) : (
              <div className="space-y-2">
                {safeIncoming.map((req) => (
                  <div key={req.id} className="p-3 bg-white rounded-lg border flex justify-between items-center">
                    <span>{req.sender?.name || "User"}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}