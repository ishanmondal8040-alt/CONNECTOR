import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  fetchNearbyUsersRequest,
  updateLocationRequest,
} from "../services/api";
import {
  sendFriendRequestApi,
  acceptFriendRequestApi,
  rejectFriendRequestApi,
  fetchPendingRequestsApi,
  fetchSentRequestsApi,
  fetchFriendsApi,
} from "../services/friendService";
import NearbyUserCard from "../components/NearbyUserCard";

const LOCATION_REQUIRED_MESSAGE = "Please update your location first.";

// Helper function to guarantee an Array is returned
const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.friends)) return data.friends;
  if (data && Array.isArray(data.requests)) return data.requests;
  if (data && Array.isArray(data.users)) return data.users;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function Dashboard() {
  const { user } = useAuth();

  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(true);
  const [nearbyError, setNearbyError] = useState(null);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);

  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  const [processingUserIds, setProcessingUserIds] = useState(new Set());

  const loadNearbyUsers = useCallback(async () => {
    setIsLoadingNearby(true);
    setNearbyError(null);
    setNeedsLocation(false);

    try {
      const response = await fetchNearbyUsersRequest(5);
      setNearbyUsers(ensureArray(response?.data));
    } catch (error) {
      const message = error.response?.data?.message;

      if (message === LOCATION_REQUIRED_MESSAGE) {
        setNeedsLocation(true);
      } else {
        setNearbyError(message || "Could not load nearby users.");
      }
    } finally {
      setIsLoadingNearby(false);
    }
  }, []);

  const loadFriendData = useCallback(async () => {
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
      const message =
        error.response?.data?.message || "Could not load friend status.";
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    loadNearbyUsers();
    loadFriendData();
  }, [loadNearbyUsers, loadFriendData]);

  // Safe mapping of relationships
  const statusByUserId = useMemo(() => {
    const map = new Map();

    const safeFriends = ensureArray(friends);
    const safeIncoming = ensureArray(incomingRequests);
    const safeSent = ensureArray(sentRequests);

    safeFriends.forEach((entry) => {
      if (entry?.friend?.id) {
        map.set(entry.friend.id, { status: "friends" });
      }
    });

    safeIncoming.forEach((request) => {
      if (request?.sender?.id) {
        map.set(request.sender.id, {
          status: "requestReceived",
          connectionId: request.id,
        });
      }
    });

    safeSent.forEach((request) => {
      if (request?.receiver?.id) {
        map.set(request.receiver.id, { status: "requestSent" });
      }
    });

    return map;
  }, [friends, incomingRequests, sentRequests]);

  const getStatusForUser = (userId) => {
    return statusByUserId.get(userId)?.status || "none";
  };

  const withProcessing = async (userId, action) => {
    if (processingUserIds.has(userId)) {
      return;
    }

    setProcessingUserIds((prev) => new Set(prev).add(userId));

    try {
      await action();
    } finally {
      setProcessingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleSendRequest = (receiverId) => {
    withProcessing(receiverId, async () => {
      try {
        await sendFriendRequestApi(receiverId);
        toast.success("Friend request sent");
        await loadFriendData();
      } catch (error) {
        const message =
          error.response?.data?.message || "Could not send friend request.";
        toast.error(message);
      }
    });
  };

  const handleAccept = (userId) => {
    const entry = statusByUserId.get(userId);

    if (!entry?.connectionId) {
      return;
    }

    withProcessing(userId, async () => {
      try {
        await acceptFriendRequestApi(entry.connectionId);
        toast.success("Friend request accepted");
        await loadFriendData();
      } catch (error) {
        const message =
          error.response?.data?.message || "Could not accept request.";
        toast.error(message);
      }
    });
  };

  const handleReject = (userId) => {
    const entry = statusByUserId.get(userId);

    if (!entry?.connectionId) {
      return;
    }

    withProcessing(userId, async () => {
      try {
        await rejectFriendRequestApi(entry.connectionId);
        toast.success("Friend request declined");
        await loadFriendData();
      } catch (error) {
        const message =
          error.response?.data?.message || "Could not decline request.";
        toast.error(message);
      }
    });
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported in this browser.");
      return;
    }

    setIsSharingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await updateLocationRequest(
            position.coords.latitude,
            position.coords.longitude
          );
          toast.success("Location updated");
          await Promise.all([loadNearbyUsers(), loadFriendData()]);
        } catch (error) {
          const message =
            error.response?.data?.message || "Could not update location.";
          toast.error(message);
        } finally {
          setIsSharingLocation(false);
        }
      },
      () => {
        toast.error("Location permission was denied.");
        setIsSharingLocation(false);
      }
    );
  };

  const safeNearbyUsers = ensureArray(nearbyUsers);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xl font-semibold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-slate-900">
              {user?.name || "User"}
            </h1>
            <p className="truncate text-sm text-slate-500">{user?.email || ""}</p>
          </div>
        </div>

        {user?.bio ? (
          <p className="mt-4 text-sm text-slate-600">{user.bio}</p>
        ) : (
          <p className="mt-4 text-sm italic text-slate-400">
            You haven&apos;t added a bio yet.
          </p>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Nearby users
          </h2>
        </div>

        {isLoadingNearby && (
          <p className="text-sm text-slate-500">Loading nearby users...</p>
        )}

        {!isLoadingNearby && needsLocation && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-sm text-slate-600">
              Share your location to see people near you.
            </p>
            <button
              type="button"
              onClick={handleShareLocation}
              disabled={isSharingLocation}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSharingLocation ? "Sharing..." : "Share my location"}
            </button>
          </div>
        )}

        {!isLoadingNearby && nearbyError && (
          <p className="text-sm text-red-600">{nearbyError}</p>
        )}

        {!isLoadingNearby &&
          !needsLocation &&
          !nearbyError &&
          safeNearbyUsers.length === 0 && (
            <p className="text-sm text-slate-500">
              No one is nearby within 5 km yet.
            </p>
          )}

        {!isLoadingNearby && safeNearbyUsers.length > 0 && (
          <div className="space-y-3">
            {safeNearbyUsers.map((nearbyUser) => (
              <NearbyUserCard
                key={nearbyUser.id}
                user={nearbyUser}
                status={getStatusForUser(nearbyUser.id)}
                isProcessing={processingUserIds.has(nearbyUser.id)}
                onSendRequest={() => handleSendRequest(nearbyUser.id)}
                onAccept={() => handleAccept(nearbyUser.id)}
                onReject={() => handleReject(nearbyUser.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}