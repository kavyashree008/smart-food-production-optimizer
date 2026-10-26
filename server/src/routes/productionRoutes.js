import { Router } from "express";
import { z } from "zod";
import {
  getProductionSchedule,
  scheduleRecommendedJobs,
  startJob,
  updateProgress,
  completeJob
} from "../controllers/productionController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const progressSchema = z.object({
  producedQuantity: z.number().min(0).optional(),
  producedQty: z.number().min(0).optional(),
  notes: z.string().optional()
});

router.use(authenticate);

router.get("/schedule", getProductionSchedule);
router.post("/schedule-recommended", requireRole(["admin", "manager"]), scheduleRecommendedJobs);
router.patch("/:id/start", requireRole(["admin", "manager", "staff"]), startJob);
router.patch("/:id/progress", requireRole(["admin", "manager", "staff"]), validate(progressSchema), updateProgress);
router.patch("/:id/complete", requireRole(["admin", "manager", "staff"]), completeJob);

export default router;