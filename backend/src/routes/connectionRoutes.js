import express from "express";

import {
  createFriendRequest,
  acceptRequest,
  rejectRequest,
  getPendingRequestList,
  getSentRequestList,
  getFriendsList,
  deleteFriend,
} from "../controllers/connectionController.js";

import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/request", protect, createFriendRequest);

router.put(
  "/request/:connectionId/accept",
  protect,
  acceptRequest
);

router.put(
  "/request/:connectionId/reject",
  protect,
  rejectRequest
);

router.get("/pending", protect, getPendingRequestList);

router.get("/sent", protect, getSentRequestList);

router.get("/friends", protect, getFriendsList);

router.delete(
  "/friends/:connectionId",
  protect,
  deleteFriend
);

export default router;