import express from "express";

import {
  updateLocation,
  getNearbyUserList,
} from "../controllers/locationController.js";

import {
  protect,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.put("/update", protect, updateLocation);

router.get("/nearby", protect, getNearbyUserList);

export default router;