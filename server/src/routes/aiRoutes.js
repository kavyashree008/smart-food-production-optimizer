import { Router } from "express";
import { explainPlan, chatAssistant } from "../controllers/aiController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.post("/explain/:planId", explainPlan);
router.post("/chat", chatAssistant);

export default router;