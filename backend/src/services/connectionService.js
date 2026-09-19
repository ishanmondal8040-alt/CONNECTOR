import prisma from "../config/prisma.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  bio: true,
  profileImage: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  updatedAt: true,
};

export const sendFriendRequest = async (senderId, receiverId) => {
  if (senderId === receiverId) {
    throw new Error("You cannot send a friend request to yourself.");
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true },
  });

  if (!receiver) {
    throw new Error("User not found.");
  }

  const existingConnection = await prisma.connection.findFirst({
    where: {
      OR: [
        { senderId, receiverId },
        {
          senderId: receiverId,
          receiverId: senderId,
        },
      ],
    },
  });

  if (existingConnection?.status === "PENDING") {
    throw new Error("Friend request already exists.");
  }

  if (existingConnection?.status === "ACCEPTED") {
    throw new Error("You are already friends.");
  }

  // Re-send a previously rejected request
  if (existingConnection?.status === "REJECTED") {
    return prisma.connection.update({
      where: {
        id: existingConnection.id,
      },
      data: {
        senderId,
        receiverId,
        status: "PENDING",
      },
      include: {
        sender: {
          select: userSelect,
        },
        receiver: {
          select: userSelect,
        },
      },
    });
  }

  return prisma.connection.create({
    data: {
      senderId,
      receiverId,
    },
    include: {
      sender: {
        select: userSelect,
      },
      receiver: {
        select: userSelect,
      },
    },
  });
};

export const acceptFriendRequest = async (connectionId, userId) => {
  const request = await prisma.connection.findUnique({
    where: { id: connectionId },
  });

  if (!request) {
    throw new Error("Friend request not found.");
  }

  if (request.receiverId !== userId) {
    throw new Error("You are not allowed to accept this request.");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request already processed.");
  }

  return prisma.connection.update({
    where: { id: connectionId },
    data: {
      status: "ACCEPTED",
    },
    include: {
      sender: {
        select: userSelect,
      },
      receiver: {
        select: userSelect,
      },
    },
  });
};

export const rejectFriendRequest = async (connectionId, userId) => {
  const request = await prisma.connection.findUnique({
    where: { id: connectionId },
  });

  if (!request) {
    throw new Error("Friend request not found.");
  }

  if (request.receiverId !== userId) {
    throw new Error("You are not allowed to reject this request.");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request already processed.");
  }

  return prisma.connection.update({
    where: { id: connectionId },
    data: {
      status: "REJECTED",
    },
    include: {
      sender: {
        select: userSelect,
      },
      receiver: {
        select: userSelect,
      },
    },
  });
};

export const getPendingRequests = async (userId) => {
  return prisma.connection.findMany({
    where: {
      receiverId: userId,
      status: "PENDING",
    },
    include: {
      sender: {
        select: userSelect,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getSentRequests = async (userId) => {
  return prisma.connection.findMany({
    where: {
      senderId: userId,
      status: "PENDING",
    },
    include: {
      receiver: {
        select: userSelect,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getFriends = async (userId) => {
  const connections = await prisma.connection.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ],
    },
    include: {
      sender: {
        select: userSelect,
      },
      receiver: {
        select: userSelect,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return connections.map((connection) => ({
    connectionId: connection.id,
    friend:
      connection.senderId === userId
        ? connection.receiver
        : connection.sender,
    friendsSince: connection.updatedAt,
  }));
};

export const removeFriend = async (connectionId, userId) => {
  const connection = await prisma.connection.findUnique({
    where: {
      id: connectionId,
    },
  });

  if (!connection) {
    throw new Error("Connection not found.");
  }

  const belongsToUser =
    connection.senderId === userId ||
    connection.receiverId === userId;

  if (!belongsToUser) {
    throw new Error("You are not allowed to remove this friend.");
  }

  if (connection.status !== "ACCEPTED") {
    throw new Error("This user is not in your friends list.");
  }

  await prisma.connection.delete({
    where: {
      id: connectionId,
    },
  });

  return {
    connectionId,
  };
};