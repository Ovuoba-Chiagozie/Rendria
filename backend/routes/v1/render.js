import express from "express";
import { renderTemplate } from "../../controllers/renderController.js";
import { batchRender} from "../../controllers/batchRenderController.js";
import { normalizeRequest } from "../../middlewares/casing.js";
import { invokeLambda } from "../../config/lamdaClient.js";

const router = express.Router();

router.post("/",normalizeRequest, renderTemplate);
router.post("/batch", batchRender);


export default router;
