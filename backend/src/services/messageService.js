import prisma from "../config/prisma.js";
import { getIO } from "../socket.js";
import { getSocketId } from "../socket/socketManager.js";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  bio: true,
  profileImage: true,
  lastSeenAt: true,
};

const replyPreviewInclude = {
  select: {
    id: true,
    content: true,
    senderId: true,
    createdAt: true,
  },
};

const ALLOWED_REACTIONS = ["👍", "❤️", "😂", "😮", "😢"];

const reactionsInclude = {
  select: {
    id: true,
    emoji: true,
    userId: true,
    createdAt: true,
    user: {
      select: {
        id: true,
        name: true,
        profileImage: true,
      },
    },
  },
  orderBy: {
    createdAt: "asc",
  },
};

// Replaces the replyTo preview of any message whose replied-to original
// the current viewer has deleted-for-me, so its real content is never
// exposed to that viewer through a reply quote. Only ever changes what
// is returned to this caller -- the underlying Message row is untouched.
const maskDeletedReplyPreviews = async (currentUserId, messages) => {
  const replyToIds = messages
    .filter((message) => message.replyTo)
    .map((message) => message.replyTo.id);

  if (replyToIds.length === 0) {
    return messages;
  }

  const deletions = await prisma.messageDeletion.findMany({
    where: {
      userId: currentUserId,
      messageId: { in: replyToIds },
    },
    select: { messageId: true },
  });

  if (deletions.length === 0) {
    return messages;
  }

  const deletedReplyToIds = new Set(
    deletions.map((deletion) => deletion.messageId)
  );

  return messages.map((message) => {
    if (message.replyTo && deletedReplyToIds.has(message.replyTo.id)) {
      return {
        ...message,
        replyTo: {
          id: message.replyTo.id,
          content: null,
          senderId: message.replyTo.senderId,
          createdAt: message.replyTo.createdAt,
          deletedForViewer: true,
        },
      };
    }
    return message;
  });
};

export const sendMessage = async (
  senderId,
  receiverId,
  content,
  replyToId
) => {
  if (!receiverId) {
    throw new Error("Receiver ID is required.");
  }

  if (!content || !content.trim()) {
    throw new Error("Message content is required.");
  }

  if (senderId === receiverId) {
    throw new Error("You cannot send a message to yourself.");
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true },
  });

  if (!receiver) {
    throw new Error("Receiver not found.");
  }

  const friendship = await prisma.connection.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId, receiverId },
        {
          senderId: receiverId,
          receiverId: senderId,
        },
      ],
    },
  });

  if (!friendship) {
    throw new Error(
      "You can only send messages to accepted friends."
    );
  }

  let validatedReplyToId = null;

  if (replyToId) {
    const replyTarget = await prisma.message.findUnique({
      where: { id: replyToId },
      select: { id: true, senderId: true, receiverId: true },
    });

    if (!replyTarget) {
      throw new Error("The message you are replying to no longer exists.");
    }

    const targetBelongsToThisConversation =
      (replyTarget.senderId === senderId &&
        replyTarget.receiverId === receiverId) ||
      (replyTarget.senderId === receiverId &&
        replyTarget.receiverId === senderId);

    if (!targetBelongsToThisConversation) {
      throw new Error(
        "You can only reply to a message from this conversation."
      );
    }

    validatedReplyToId = replyToId;
  }

  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      content: content.trim(),
      replyToId: validatedReplyToId,
    },
    include: {
      sender: {
        select: safeUserSelect,
      },
      receiver: {
        select: safeUserSelect,
      },
      replyTo: replyPreviewInclude,
      reactions: reactionsInclude,
    },
  });

  const receiverSocketId = getSocketId(receiverId);

  if (receiverSocketId) {
    try {
      getIO().to(receiverSocketId).emit("message:receive", message);
    } catch {
      // Socket.IO unavailable; the message is already saved, so the
      // REST request still succeeds without real-time delivery.
    }

    const deliveredAt = new Date();

    const updatedMessage = await prisma.message.update({
      where: { id: message.id },
      data: {
        isDelivered: true,
        deliveredAt,
      },
      include: {
        sender: {
          select: safeUserSelect,
        },
        receiver: {
          select: safeUserSelect,
        },
        replyTo: replyPreviewInclude,
        reactions: reactionsInclude,
      },
    });

    const senderSocketId = getSocketId(senderId);

    if (senderSocketId) {
      try {
        getIO().to(senderSocketId).emit("message:delivered", {
          messageId: message.id,
          deliveredAt,
        });
      } catch {
        // Socket.IO unavailable; delivered status is already saved, so
        // the REST request still succeeds without real-time notification.
      }
    }

    return updatedMessage;
  }

  return message;
};

export const getChatHistory = async (
  currentUserId,
  otherUserId
) => {
  if (!otherUserId) {
    throw new Error("User ID is required.");
  }

  if (currentUserId === otherUserId) {
    throw new Error("You cannot open a chat with yourself.");
  }

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: safeUserSelect,
  });

  if (!otherUser) {
    throw new Error("User not found.");
  }

  const friendship = await prisma.connection.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        {
          senderId: currentUserId,
          receiverId: otherUserId,
        },
        {
          senderId: otherUserId,
          receiverId: currentUserId,
        },
      ],
    },
  });

  if (!friendship) {
    throw new Error(
      "You can only view chats with accepted friends."
    );
  }

  const messages = await prisma.message.findMany({
    where: {
      AND: [
        {
          OR: [
            {
              senderId: currentUserId,
              receiverId: otherUserId,
            },
            {
              senderId: otherUserId,
              receiverId: currentUserId,
            },
          ],
        },
        {
          NOT: {
            deletions: {
              some: { userId: currentUserId },
            },
          },
        },
      ],
    },
    include: {
      sender: {
        select: safeUserSelect,
      },
      receiver: {
        select: safeUserSelect,
      },
      replyTo: replyPreviewInclude,
      reactions: reactionsInclude,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const safeMessages = await maskDeletedReplyPreviews(
    currentUserId,
    messages
  );

  return {
    user: otherUser,
    messages: safeMessages,
  };
};

export const getConversationList = async (currentUserId) => {
  const messages = await prisma.message.findMany({
    where: {
      AND: [
        {
          OR: [
            { senderId: currentUserId },
            { receiverId: currentUserId },
          ],
        },
        {
          NOT: {
            deletions: {
              some: { userId: currentUserId },
            },
          },
        },
      ],
    },
    include: {
      sender: {
        select: safeUserSelect,
      },
      receiver: {
        select: safeUserSelect,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const conversationMap = new Map();

  for (const message of messages) {
    const otherUser =
      message.senderId === currentUserId
        ? message.receiver
        : message.sender;

    if (!conversationMap.has(otherUser.id)) {
      conversationMap.set(otherUser.id, {
        user: otherUser,
        lastMessage: {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      isRead: message.isRead,
      readAt: message.readAt,
      isDelivered: message.isDelivered,
      deliveredAt: message.deliveredAt,
      createdAt: message.createdAt,
    },
        unreadCount: 0,
      });
    }

    if (
      message.receiverId === currentUserId &&
      message.isRead === false
    ) {
      conversationMap.get(otherUser.id).unreadCount += 1;
    }
  }

  return Array.from(conversationMap.values());
};

export const markChatAsRead = async (
  currentUserId,
  otherUserId
) => {
  if (!otherUserId) {
    throw new Error("User ID is required.");
  }

  if (currentUserId === otherUserId) {
    throw new Error("You cannot mark your own chat as read.");
  }

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true },
  });

  if (!otherUser) {
    throw new Error("User not found.");
  }

  const readAt = new Date();

  const result = await prisma.message.updateMany({
    where: {
      senderId: otherUserId,
      receiverId: currentUserId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt,
    },
  });

  if (result.count > 0) {
    const senderSocketId = getSocketId(otherUserId);

    if (senderSocketId) {
      try {
        getIO().to(senderSocketId).emit("message:seen", {
          readerId: currentUserId,
          readAt,
        });
      } catch {
        // Socket.IO unavailable; the read status is already saved, so
        // the REST request still succeeds without real-time delivery.
      }
    }
  }

  return {
    updatedCount: result.count,
  };
};

export const toggleReaction = async (userId, messageId, emoji) => {
  if (!ALLOWED_REACTIONS.includes(emoji)) {
    throw new Error("That reaction is not supported.");
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, senderId: true, receiverId: true },
  });

  if (!message) {
    throw new Error("Message not found.");
  }

  const isParticipant =
    message.senderId === userId || message.receiverId === userId;

  if (!isParticipant) {
    throw new Error("You do not have access to this message.");
  }

  const existingReaction = await prisma.messageReaction.findUnique({
    where: {
      messageId_userId: {
        messageId,
        userId,
      },
    },
  });

  if (!existingReaction) {
    await prisma.messageReaction.create({
      data: {
        messageId,
        userId,
        emoji,
      },
    });
  } else if (existingReaction.emoji === emoji) {
    await prisma.messageReaction.delete({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });
  } else {
    await prisma.messageReaction.update({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      data: {
        emoji,
      },
    });
  }

  const reactions = await prisma.messageReaction.findMany({
    where: { messageId },
    ...reactionsInclude,
  });

  const payload = {
    messageId,
    reactions,
  };

  for (const participantId of [message.senderId, message.receiverId]) {
    const participantSocketId = getSocketId(participantId);

    if (participantSocketId) {
      try {
        getIO().to(participantSocketId).emit("message:reaction", payload);
      } catch {
        // Socket.IO unavailable; the reaction is already saved, so the
        // REST request still succeeds without real-time notification.
      }
    }
  }

  return payload;
};

export const editMessage = async (userId, messageId, content) => {
  if (!content || !content.trim()) {
    throw new Error("Message content cannot be empty.");
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, senderId: true, receiverId: true },
  });

  if (!message) {
    throw new Error("Message not found.");
  }

  if (message.senderId !== userId) {
    throw new Error("You can only edit your own messages.");
  }

  const editedAt = new Date();

  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: {
      content: content.trim(),
      editedAt,
    },
    include: {
      sender: {
        select: safeUserSelect,
      },
      receiver: {
        select: safeUserSelect,
      },
      replyTo: replyPreviewInclude,
      reactions: reactionsInclude,
    },
  });

  const payload = {
    messageId,
    content: updatedMessage.content,
    editedAt,
  };

  for (const participantId of [message.senderId, message.receiverId]) {
    const participantSocketId = getSocketId(participantId);

    if (participantSocketId) {
      try {
        getIO().to(participantSocketId).emit("message:edited", payload);
      } catch {
        // Socket.IO unavailable; the edit is already saved, so the
        // REST request still succeeds without real-time notification.
      }
    }
  }

  return updatedMessage;
};

export const deleteMessageForMe = async (userId, messageId) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, senderId: true, receiverId: true },
  });

  if (!message) {
    throw new Error("Message not found.");
  }

  const isParticipant =
    message.senderId === userId || message.receiverId === userId;

  if (!isParticipant) {
    throw new Error("You do not have access to this message.");
  }

  // Idempotent: deleting the same message for yourself twice is a no-op,
  // not an error.
  await prisma.messageDeletion.upsert({
    where: {
      messageId_userId: {
        messageId,
        userId,
      },
    },
    update: {},
    create: {
      messageId,
      userId,
    },
  });

  // Deliberately no socket emit here: deleting a message for yourself
  // must be invisible to the other participant.
};