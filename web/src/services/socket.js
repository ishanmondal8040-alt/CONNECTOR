import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

let socket = null;

export function connectSocket() {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  if (socket) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}