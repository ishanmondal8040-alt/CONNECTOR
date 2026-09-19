const onlineUsers = new Map();

export const addUser = (userId, socketId) => {
  onlineUsers.set(userId, socketId);
};

export const removeUser = (socketId) => {
  for (const [userId, storedSocketId] of onlineUsers.entries()) {
    if (storedSocketId === socketId) {
      onlineUsers.delete(userId);
      break;
    }
  }
};

export const getSocketId = (userId) => {
  return onlineUsers.get(userId);
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};