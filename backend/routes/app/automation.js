import express from "express";
import { getAutomationConfig } from "../../controllers/automationController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js"; // Adjust path to your auth middleware

const router = express.Router();

// GET /api/automation/:id - Get automation config for a template
router.get("/:id", authMiddleware , getAutomationConfig);

export default router;