import { Router } from "express";
import { getDemandAnalysis } from "../controllers/demandController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/:productId", getDemandAnalysis);

export default router;