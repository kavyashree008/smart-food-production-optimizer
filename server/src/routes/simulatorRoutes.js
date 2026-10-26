import { Router } from "express";
import { z } from "zod";
import {
  runSimulation,
  saveSimulation,
  getSimulationHistory
} from "../controllers/simulatorController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const simSchema = z.object({
  demandChangePercent: z.number().min(-100).max(300).default(0),
  supplierDelayDays: z.number().min(0).max(30).default(0),
  capacityChangePercent: z.number().min(-100).max(200).default(0),
  urgentOrdersAdded: z.array(z.any()).optional()
});

router.use(authenticate);

router.post("/run", requireRole(["admin", "manager"]), validate(simSchema), runSimulation);
router.post("/save", requireRole(["admin", "manager"]), saveSimulation);
router.get("/history", getSimulationHistory);

export default router;