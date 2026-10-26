import { Router } from "express";
import { z } from "zod";
import {
  getRecipes,
  getRecipeByProductId,
  createRecipe,
  updateRecipe
} from "../controllers/recipeController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const ingredientSchema = z.object({
  rawMaterialId: z.string().min(1),
  qtyPerUnit: z.number().positive()
});

const recipeSchema = z.object({
  productId: z.string().min(1),
  ingredients: z.array(ingredientSchema).min(1),
  yieldPerBatch: z.number().positive().default(100)
});

router.use(authenticate);

router.get("/", getRecipes);
router.get("/product/:productId", getRecipeByProductId);
router.post("/", requireRole(["admin", "manager"]), validate(recipeSchema), createRecipe);
router.put("/:id", requireRole(["admin", "manager"]), validate(recipeSchema.partial()), updateRecipe);

export default router;