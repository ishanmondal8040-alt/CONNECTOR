import express from "express";

import { protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import { uploadPostImageController } from "../controllers/uploadController.js";

const router = express.Router();

router.post(
  "/post-image",
  protect,
  upload.single("image"),
  uploadPostImageController
);

export default router;