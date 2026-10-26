import { Router } from "express";
import { z } from "zod";
import {
  getBatches,
  getExpiringSoon,
  createBatch,
  markDamaged
} from "../controllers/batchController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const batchSchema = z.object({
  rawMaterialId: z.string().min(1),
  batchNo: z.string().min(2),
  quantity: z.number().min(0.1),
  receivedDate: z.string().datetime().or(z.date()).optional(),
  expiryDate: z.string().datetime().or(z.date()),
  costPerUnit: z.number().min(0).optional()
});

router.use(authenticate);

router.get("/", getBatches);
router.get("/expiring-soon", getExpiringSoon);
router.post("/", requireRole(["admin", "manager"]), validate(batchSchema), createBatch);
router.post("/:id/mark-damaged", requireRole(["admin", "manager", "staff"]), markDamaged);

export default router;