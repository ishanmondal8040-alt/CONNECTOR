import api from "./api";

export const fetchPostCommentsApi = (postId: string) => {
  return api.get('/comments/post/' + postId);
};

export const createCommentApi = (postId: string, content: string) => {
  return api.post('/comments/post/' + postId, { content });
};

export const editCommentApi = (commentId: string, content: string) => {
  return api.put('/comments/' + commentId, { content });
};

export const deleteCommentApi = (commentId: string) => {
  return api.delete('/comments/' + commentId);
};
