import prisma from "../config/prisma.js";

export const updateUserProfile = async (userId, data) => {
  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data,
  });

  const { password: _, ...safeUser } = updatedUser;

  return safeUser;
};