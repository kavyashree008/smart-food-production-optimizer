import { Router } from "express";
import { z } from "zod";
import {
  getSalesHistory,
  createSaleRecord,
  importSalesCsv
} from "../controllers/salesController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const saleRecordSchema = z.object({
  productId: z.string().min(1),
  date: z.string().or(z.date()),
  quantitySold: z.number().min(0)
});

router.use(authenticate);

router.get("/", getSalesHistory);
router.post("/", requireRole(["admin", "manager"]), validate(saleRecordSchema), createSaleRecord);
router.post("/import-csv", requireRole(["admin", "manager"]), importSalesCsv);

export default router;