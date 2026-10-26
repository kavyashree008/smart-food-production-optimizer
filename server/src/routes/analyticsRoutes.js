import { Router } from "express";
import {
  getDashboardSummary,
  getWasteAnalytics
} from "../controllers/analyticsController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/summary", getDashboardSummary);
router.get("/waste", getWasteAnalytics);

export default router;