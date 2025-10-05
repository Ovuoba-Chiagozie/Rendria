import express from "express";
import { renderTemplate } from "../../controllers/renderController.js";
import { invokeLambda } from "../../config/lamdaClient.js";

const router = express.Router();

router.post("/", renderTemplate);


export default router;
