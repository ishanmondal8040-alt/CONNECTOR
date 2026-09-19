import api from "./api";

export const fetchConversationsApi = () => {
  return api.get("/messages/conversations");
};

export const fetchChatHistoryApi = (friendId: string) => {
  return api.get('/messages/chat/' + friendId);
};

export const sendMessageApi = (receiverId: string, text: string, replyToId?: string | null) => {
  return api.post("/messages/send", { receiverId, text, replyToId });
};

export const markChatReadApi = (friendId: string) => {
  return api.put('/messages/chat/' + friendId + '/read');
};

export const reactToMessageApi = (messageId: string, emoji: string) => {
  return api.post('/messages/' + messageId + '/reaction', { emoji });
};

export const editMessageApi = (messageId: string, text: string) => {
  return api.put('/messages/' + messageId, { text });
};

export const deleteMessageForMeApi = (messageId: string) => {
  return api.delete('/messages/' + messageId + '/me');
};
