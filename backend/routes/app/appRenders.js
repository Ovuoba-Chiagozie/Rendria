import express from "express";
import { getRenders, deleteRender } from "../../controllers/renderController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// guarded by API key, but no credits check needed
router.get("/", authMiddleware, getRenders);
router.delete("/:id", authMiddleware, deleteRender);

export default router;