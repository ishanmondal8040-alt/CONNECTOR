import express from "express";
import {
  registerUser,
  loginUser,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";
import {
  registerSchema,
  loginSchema,
} from "../validators/authValidator.js";

const router = express.Router();

router.post(
  "/register",
  authRateLimiter,
  validate(registerSchema),
  registerUser
);
router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  loginUser
);

router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

export default router;