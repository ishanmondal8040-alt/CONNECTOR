import express from "express";

import {
  createCommentController,
  getPostCommentsController,
  editCommentController,
  deleteCommentController,
} from "../controllers/commentController.js";

import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/post/:postId",
  protect,
  createCommentController
);

router.get(
  "/post/:postId",
  protect,
  getPostCommentsController
);

router.put(
  "/:commentId",
  protect,
  editCommentController
);

router.delete(
  "/:commentId",
  protect,
  deleteCommentController
);

export default router;