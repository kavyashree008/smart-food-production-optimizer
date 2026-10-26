import { Router } from "express";
import { z } from "zod";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  unit: z.string().default("kg"),
  category: z.enum(["Biscuits", "Bakery", "Snacks", "Sweets", "Packaged Foods"]),
  shelfLifeDays: z.number().min(1),
  safetyStock: z.number().min(0),
  currentStock: z.number().min(0).default(0),
  productionRatePerHour: z.number().min(1),
  sellingPrice: z.number().min(0)
});

router.use(authenticate);

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", requireRole(["admin", "manager"]), validate(productSchema), createProduct);
router.put("/:id", requireRole(["admin", "manager"]), validate(productSchema.partial()), updateProduct);
router.delete("/:id", requireRole(["admin"]), deleteProduct);

export default router;