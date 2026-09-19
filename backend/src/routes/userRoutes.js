import express from "express";
import { updateProfile } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { updateProfileSchema } from "../validators/userValidator.js";

const router = express.Router();

router.put("/profile", protect, validate(updateProfileSchema), updateProfile);

export default router;