import { Router } from "express";
import { z } from "zod";
import {
  getFestivals,
  createFestival,
  updateFestival,
  deleteFestival
} from "../controllers/festivalController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const festivalSchema = z.object({
  name: z.string().min(2),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  demandMultiplier: z.number().min(1),
  productCategories: z.array(z.string()).min(1)
});

router.use(authenticate);

router.get("/", getFestivals);
router.post("/", requireRole(["admin"]), validate(festivalSchema), createFestival);
router.put("/:id", requireRole(["admin"]), validate(festivalSchema.partial()), updateFestival);
router.delete("/:id", requireRole(["admin"]), deleteFestival);

export default router;