import prisma from "../config/prisma.js";

const safeAuthorSelect = {
  id: true,
  name: true,
  profileImage: true,
};

export const createComment = async (authorId, postId, content) => {
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Comment cannot be empty.");
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    throw new Error("Post not found.");
  }

  return prisma.comment.create({
    data: {
      authorId,
      postId,
      content: content.trim(),
    },
    include: {
      author: {
        select: safeAuthorSelect,
      },
    },
  });
};

export const getPostComments = async (postId) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    throw new Error("Post not found.");
  }

  return prisma.comment.findMany({
    where: { postId },
    include: {
      author: {
        select: safeAuthorSelect,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const editComment = async (userId, commentId, content) => {
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Comment cannot be empty.");
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!comment) {
    throw new Error("Comment not found.");
  }

  if (comment.authorId !== userId) {
    throw new Error("You can only edit your own comments.");
  }

  return prisma.comment.update({
    where: { id: commentId },
    data: {
      content: content.trim(),
      editedAt: new Date(),
    },
    include: {
      author: {
        select: safeAuthorSelect,
      },
    },
  });
};

export const deleteComment = async (userId, commentId) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!comment) {
    throw new Error("Comment not found.");
  }

  if (comment.authorId !== userId) {
    throw new Error("You can only delete your own comments.");
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  return { commentId };
};