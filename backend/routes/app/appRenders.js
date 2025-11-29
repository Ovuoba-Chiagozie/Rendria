import express from "express";
import { getRenders, deleteRender } from "../../controllers/renderController.js";
import {  getBatches, getBatchById } from "../../controllers/batchRenderController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { invokeLambda } from "../../config/lamdaClient.js";

const router = express.Router();

// guarded by API key, but no credits check needed
router.get("/", authMiddleware, getRenders);
router.delete("/:id", authMiddleware, deleteRender);
router.get("/batches", authMiddleware, getBatches);
router.get("/batches/:id", authMiddleware, getBatchById);

router.get("/test-lambda", async (req, res) => {
    try {
      const result = await invokeLambda({ foo: "bar" });
      res.json(result);
    } catch (err) {
      console.error("Lambda error:", err);
      res.status(500).json({ error: "Failed to call Lambda" });
    }
  });

export default router;