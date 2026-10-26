import { Router } from "express";
import { z } from "zod";
import {
  getRawMaterials,
  getRawMaterialById,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial
} from "../controllers/rawMaterialController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const rawMaterialSchema = z.object({
  name: z.string().min(2),
  unit: z.string().default("kg"),
  supplier: z.string().min(2),
  leadTimeDays: z.number().min(0).default(2),
  reorderLevel: z.number().min(0).default(100),
  costPerUnit: z.number().min(0)
});

router.use(authenticate);

router.get("/", getRawMaterials);
router.get("/:id", getRawMaterialById);
router.post("/", requireRole(["admin", "manager"]), validate(rawMaterialSchema), createRawMaterial);
router.put("/:id", requireRole(["admin", "manager"]), validate(rawMaterialSchema.partial()), updateRawMaterial);
router.delete("/:id", requireRole(["admin"]), deleteRawMaterial);

export default router;