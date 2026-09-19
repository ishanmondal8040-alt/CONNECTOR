import { Server } from "socket.io";
import prisma from "./config/prisma.js";
import { socketAuth } from "./socket/socketAuth.js";
import {
  addUser,
  removeUser,
  getOnlineUsers,
  getSocketId,
} from "./socket/socketManager.js";

let io;

const isValidReceiverId = (receiverId, senderId) => {
  return (
    typeof receiverId === "string" &&
    receiverId.length > 0 &&
    receiverId !== senderId
  );
};

const emitTypingStatus = (socket, receiverId, isTyping) => {
  const senderId = socket.user.id;

  if (!isValidReceiverId(receiverId, senderId)) {
    return;
  }

  const receiverSocketId = getSocketId(receiverId);

  if (!receiverSocketId) {
    return;
  }

  io.to(receiverSocketId).emit("typing:receive", {
    senderId,
    isTyping,
  });
};

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    const userId = socket.user.id;

    addUser(userId, socket.id);

    console.log(`${socket.user.name} connected: ${socket.id}`);

    io.emit("online-users", getOnlineUsers());

    socket.on("typing:start", (payload) => {
      emitTypingStatus(socket, payload?.receiverId, true);
    });

    socket.on("typing:stop", (payload) => {
      emitTypingStatus(socket, payload?.receiverId, false);
    });

    socket.on("disconnect", async () => {
      const lastSeenAt = new Date();

      try {
        await prisma.user.update({
          where: { id: userId },
          data: { lastSeenAt },
        });
      } catch {
        // lastSeenAt update failed হলেও
        // presence system চলতে থাকবে।
      }

      removeUser(socket.id);

      console.log(`${socket.user.name} disconnected`);

      io.emit("online-users", getOnlineUsers());
    });
  });

  console.log("Socket.IO running on http://localhost:5000");

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO is not initialized.");
  }

  return io;
};