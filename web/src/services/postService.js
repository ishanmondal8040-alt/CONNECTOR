import api from "./api";

export const createPostApi = (caption, imageUrl) => {
  return api.post("/posts", { caption, imageUrl });
};

export const fetchFeedApi = () => {
  return api.get("/posts/feed");
};

export const fetchUserPostsApi = (userId) => {
  return api.get(`/posts/user/${userId}`);
};

export const editPostApi = (postId, caption, imageUrl) => {
  return api.put(`/posts/${postId}`, { caption, imageUrl });
};

export const deletePostApi = (postId) => {
  return api.delete(`/posts/${postId}`);
};

export const uploadPostImageApi = (file) => {
  const formData = new FormData();
  formData.append("image", file);

  return api.post("/uploads/post-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};