import express from "express";
import { renderTemplate } from "../../controllers/renderController.js";

const router = express.Router();

router.post("/", renderTemplate);

export default router;
