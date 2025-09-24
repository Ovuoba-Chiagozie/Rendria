import express from "express";
import { signup, login, getMe, logout } from "../../controllers/authController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { authLimiter } from "../../middlewares/rateLimiter.js";
import { signupValidation, loginValidation, validate } from "../../middlewares/authValidators.js";

const router = express.Router();

// Signup → rate limit + validation + controller
router.post("/signup", authLimiter, signupValidation, validate, signup);

// Login → rate limit + validation + controller
router.post("/login", authLimiter, loginValidation, validate, login);

// Get current user → must be logged in
router.get("/me", authMiddleware, getMe);

// Logout → must be logged in (optional but recommended)
router.post("/logout", authMiddleware, logout);

export default router;
