import mongoose from "mongoose";

const recipeIngredientSchema = new mongoose.Schema(
  {
    rawMaterialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RawMaterial",
      required: true
    },
    qtyPerUnit: {
      type: Number,
      required: true,
      min: 0.0001
    }
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
      unique: true
    },
    ingredients: {
      type: [recipeIngredientSchema],
      required: true,
      validate: [(val) => val.length > 0, "Recipe must include at least one ingredient"]
    },
    yieldPerBatch: {
      type: Number,
      required: true,
      default: 100,
      min: 1
    }
  },
  { timestamps: true }
);

export const Recipe = mongoose.model("Recipe", recipeSchema);