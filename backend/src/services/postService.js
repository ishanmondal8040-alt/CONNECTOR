import prisma from "../config/prisma.js";

const safeAuthorSelect = {
  id: true,
  name: true,
  profileImage: true,
  bio: true,
};

export const createPost = async (authorId, caption, imageUrl) => {
  const trimmedCaption = caption ? caption.trim() : null;
  const trimmedImageUrl = imageUrl ? imageUrl.trim() : null;

  if (!trimmedCaption && !trimmedImageUrl) {
    throw new Error("Post cannot be empty.");
  }

  const post = await prisma.post.create({
    data: {
      authorId,
      caption: trimmedCaption,
      imageUrl: trimmedImageUrl,
    },
    include: {
      author: {
        select: safeAuthorSelect,
      },
    },
  });

  return post;
};

export const getFeed = async () => {
  const posts = await prisma.post.findMany({
    include: {
      author: {
        select: safeAuthorSelect,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return posts;
};

export const getUserPosts = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    include: {
      author: {
        select: safeAuthorSelect,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return posts;
};

export const editPost = async (userId, postId, caption, imageUrl) => {
  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!existingPost) {
    throw new Error("Post not found.");
  }

  if (existingPost.authorId !== userId) {
    throw new Error("You can only edit your own posts.");
  }

  const nextCaption =
    caption !== undefined
      ? caption
        ? caption.trim()
        : null
      : existingPost.caption;

  const nextImageUrl =
    imageUrl !== undefined
      ? imageUrl
        ? imageUrl.trim()
        : null
      : existingPost.imageUrl;

  if (!nextCaption && !nextImageUrl) {
    throw new Error("Post cannot be empty.");
  }

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      caption: nextCaption,
      imageUrl: nextImageUrl,
    },
    include: {
      author: {
        select: safeAuthorSelect,
      },
    },
  });

  return updatedPost;
};

export const deletePost = async (userId, postId) => {
  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!existingPost) {
    throw new Error("Post not found.");
  }

  if (existingPost.authorId !== userId) {
    throw new Error("You can only delete your own posts.");
  }

  await prisma.post.delete({
    where: { id: postId },
  });

  return { postId };
};