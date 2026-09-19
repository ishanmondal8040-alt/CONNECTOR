import api from "./api";

export const createCommentApi = (postId, content) => {
  return api.post(`/comments/post/${postId}`, { content });
};

export const fetchPostCommentsApi = (postId) => {
  return api.get(`/comments/post/${postId}`);
};

export const editCommentApi = (commentId, content) => {
  return api.put(`/comments/${commentId}`, { content });
};

export const deleteCommentApi = (commentId) => {
  return api.delete(`/comments/${commentId}`);
};