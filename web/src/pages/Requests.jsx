import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  fetchPendingRequestsApi,
  fetchSentRequestsApi,
  acceptFriendRequestApi,
  rejectFriendRequestApi,
} from "../services/friendService";
import FriendRequestCard from "../components/FriendRequestCard";

export default function Requests() {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  const [isLoadingReceived, setIsLoadingReceived] = useState(true);
  const [isLoadingSent, setIsLoadingSent] = useState(true);
  const [receivedError, setReceivedError] = useState(null);
  const [sentError, setSentError] = useState(null);

  const [processingIds, setProcessingIds] = useState(new Set());

  const loadReceivedRequests = useCallback(async () => {
    setIsLoadingReceived(true);
    setReceivedError(null);

    try {
      const response = await fetchPendingRequestsApi();
      setReceivedRequests(response.data.requests);
    } catch (err) {
      setReceivedError(
        err.response?.data?.message || "Could not load incoming requests."
      );
    } finally {
      setIsLoadingReceived(false);
    }
  }, []);

  const loadSentRequests = useCallback(async () => {
    setIsLoadingSent(true);
    setSentError(null);

    try {
      const response = await fetchSentRequestsApi();
      setSentRequests(response.data.requests);
    } catch (err) {
      setSentError(
        err.response?.data?.message || "Could not load sent requests."
      );
    } finally {
      setIsLoadingSent(false);
    }
  }, []);

  useEffect(() => {
    loadReceivedRequests();
    loadSentRequests();
  }, [loadReceivedRequests, loadSentRequests]);

  const withProcessing = async (connectionId, action) => {
    if (processingIds.has(connectionId)) {
      return;
    }

    setProcessingIds((prev) => new Set(prev).add(connectionId));

    try {
      await action();
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(connectionId);
        return next;
      });
    }
  };

  const handleAccept = (connectionId) => {
    withProcessing(connectionId, async () => {
      try {
        await acceptFriendRequestApi(connectionId);
        toast.success("Friend request accepted");
        await Promise.all([loadReceivedRequests(), loadSentRequests()]);
      } catch (err) {
        const message =
          err.response?.data?.message || "Could not accept request.";
        toast.error(message);
      }
    });
  };

  const handleReject = (connectionId) => {
    withProcessing(connectionId, async () => {
      try {
        await rejectFriendRequestApi(connectionId);
        toast.success("Friend request declined");
        await loadReceivedRequests();
      } catch (err) {
        const message =
          err.response?.data?.message || "Could not decline request.";
        toast.error(message);
      }
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-lg font-semibold text-slate-900">Requests</h1>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Received Requests
        </h2>

        {isLoadingReceived && (
          <p className="text-sm text-slate-500">Loading...</p>
        )}

        {!isLoadingReceived && receivedError && (
          <p className="text-sm text-red-600">{receivedError}</p>
        )}

        {!isLoadingReceived &&
          !receivedError &&
          receivedRequests.length === 0 && (
            <p className="text-sm text-slate-500">
              No incoming friend requests.
            </p>
          )}

        {!isLoadingReceived && receivedRequests.length > 0 && (
          <div className="space-y-3">
            {receivedRequests.map((request) => (
              <FriendRequestCard
                key={request.id}
                request={request}
                type="received"
                isProcessing={processingIds.has(request.id)}
                onAccept={() => handleAccept(request.id)}
                onReject={() => handleReject(request.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Sent Requests
        </h2>

        {isLoadingSent && (
          <p className="text-sm text-slate-500">Loading...</p>
        )}

        {!isLoadingSent && sentError && (
          <p className="text-sm text-red-600">{sentError}</p>
        )}

        {!isLoadingSent && !sentError && sentRequests.length === 0 && (
          <p className="text-sm text-slate-500">
            You don&apos;t have any pending sent requests.
          </p>
        )}

        {!isLoadingSent && sentRequests.length > 0 && (
          <div className="space-y-3">
            {sentRequests.map((request) => (
              <FriendRequestCard
                key={request.id}
                request={request}
                type="sent"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}