import { Router } from "express";
import { z } from "zod";
import {
  getRecommendations,
  runPlanning,
  acceptPlan,
  modifyPlan,
  rejectPlan,
  getPlanHistory
} from "../controllers/planningController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const runPlanSchema = z.object({
  changeReason: z.string().optional(),
  productId: z.string().optional()
});

const modifyPlanSchema = z.object({
  quantity: z.number().min(0)
});

router.use(authenticate);

router.get("/recommendations", getRecommendations);
router.post("/run", requireRole(["admin", "manager"]), validate(runPlanSchema), runPlanning);
router.post("/:id/accept", requireRole(["admin", "manager"]), acceptPlan);
router.post("/:id/modify", requireRole(["admin", "manager"]), validate(modifyPlanSchema), modifyPlan);
router.post("/:id/reject", requireRole(["admin", "manager"]), rejectPlan);
router.get("/:id/history", getPlanHistory);

export default router;