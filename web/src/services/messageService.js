import api from "./api";

export const fetchChatHistoryApi = (userId) => {
  return api.get(`/messages/chat/${userId}`);
};

export const sendMessageApi = (receiverId, content, replyToId) => {
  return api.post("/messages/send", { receiverId, content, replyToId });
};

export const fetchConversationsApi = () => {
  return api.get("/messages/conversations");
};

export const markChatAsReadApi = (userId) => {
  return api.put(`/messages/chat/${userId}/read`);
};

export const reactToMessageApi = (messageId, emoji) => {
  return api.post(`/messages/${messageId}/reaction`, { emoji });
};

export const editMessageApi = (messageId, content) => {
  return api.put(`/messages/${messageId}`, { content });
};

export const deleteMessageForMeApi = (messageId) => {
  return api.delete(`/messages/${messageId}/me`);
};