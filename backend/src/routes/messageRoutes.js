import express from "express";

import {
  createMessage,
  getChat,
  getConversations,
  markMessagesAsRead,
  reactToMessage,
  editMessageController,
  deleteMessageForMeController,
} from "../controllers/messageController.js";

import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/send", protect, createMessage);

router.get(
  "/conversations",
  protect,
  getConversations
);

router.get(
  "/chat/:userId",
  protect,
  getChat
);

router.put(
  "/chat/:userId/read",
  protect,
  markMessagesAsRead
);

router.post(
  "/:messageId/reaction",
  protect,
  reactToMessage
);

router.put(
  "/:messageId",
  protect,
  editMessageController
);

router.delete(
  "/:messageId/me",
  protect,
  deleteMessageForMeController
);

export default router;