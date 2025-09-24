import express from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import {
  getApiKeys,
  regenerateApiKey,
  revokeApiKey,
} from "../../controllers/apiKeyController.js";

const router = express.Router();

// All routes protected
router.use(authMiddleware);

// GET active API keys
router.get("/", getApiKeys);

// Regenerate API key
router.post("/regenerate", regenerateApiKey);

// Revoke specific API key
router.post("/revoke", revokeApiKey);

export default router;
