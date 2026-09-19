import api from "./api";

export const sendFriendRequestApi = (receiverId) => {
  return api.post("/connections/request", { receiverId });
};

export const acceptFriendRequestApi = (connectionId) => {
  return api.put(`/connections/request/${connectionId}/accept`);
};

export const rejectFriendRequestApi = (connectionId) => {
  return api.put(`/connections/request/${connectionId}/reject`);
};

export const fetchPendingRequestsApi = () => {
  return api.get("/connections/pending");
};

export const fetchSentRequestsApi = () => {
  return api.get("/connections/sent");
};

export const fetchFriendsApi = () => {
  return api.get("/connections/friends");
};

export const removeFriendApi = (connectionId) => {
  return api.delete(`/connections/friends/${connectionId}`);
};