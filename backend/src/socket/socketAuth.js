import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export const socketAuth = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(
        "Bearer ",
        ""
      );

    if (!token) {
      return next(
        new Error("Authentication token is required.")
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
      },
    });

    if (!user) {
      return next(new Error("User not found."));
    }

    socket.user = user;

    next();
  } catch (error) {
    next(new Error("Invalid or expired token."));
  }
};