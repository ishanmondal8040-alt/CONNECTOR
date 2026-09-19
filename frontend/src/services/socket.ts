import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Socket Server URL (10.0.2.2 for Android Emulator, or Local IP for physical device)
const SOCKET_URL = "http://10.0.2.2:5000";

let socket: Socket | null = null;

export const initSocket = async (): Promise<Socket> => {
  const token = await AsyncStorage.getItem("token");

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
    });
  }

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
