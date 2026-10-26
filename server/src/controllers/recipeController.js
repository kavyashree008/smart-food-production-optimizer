import { Recipe } from "../models/Recipe.js";

export async function getRecipes(req, res, next) {
  try {
    const recipes = await Recipe.find()
      .populate("productId", "name sku category sellingPrice")
      .populate("ingredients.rawMaterialId", "name unit costPerUnit leadTimeDays");
    return res.status(200).json({ success: true, count: recipes.length, recipes });
  } catch (error) {
    return next(error);
  }
}

export async function getRecipeByProductId(req, res, next) {
  try {
    const recipe = await Recipe.findOne({ productId: req.params.productId })
      .populate("productId", "name sku category sellingPrice")
      .populate("ingredients.rawMaterialId", "name unit costPerUnit leadTimeDays");
    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found for this product" });
    }
    return res.status(200).json({ success: true, recipe });
  } catch (error) {
    return next(error);
  }
}

export async function createRecipe(req, res, next) {
  try {
    const existing = await Recipe.findOne({ productId: req.body.productId });
    if (existing) {
      return res.status(409).json({ success: false, message: "A recipe for this product already exists" });
    }
    const recipe = await Recipe.create(req.body);
    return res.status(201).json({ success: true, message: "Recipe created successfully", recipe });
  } catch (error) {
    return next(error);
  }
}

export async function updateRecipe(req, res, next) {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }
    return res.status(200).json({ success: true, message: "Recipe updated successfully", recipe });
  } catch (error) {
    return next(error);
  }
}