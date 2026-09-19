import api from './api';

export const fetchPostsApi = async () => {
  return await api.get('/posts');
};

export const createPostApi = async (postData: { caption?: string; image?: string }) => {
  return await api.post('/posts', postData);
};

export const likePostApi = async (postId: string) => {
  return await api.post('/posts/' + postId + '/like');
};
