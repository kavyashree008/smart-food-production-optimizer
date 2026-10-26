import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      unique: true
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true
    },
    unit: {
      type: String,
      required: true,
      default: "kg"
    },
    category: {
      type: String,
      required: true,
      enum: ["Biscuits", "Bakery", "Snacks", "Sweets", "Packaged Foods"],
      default: "Snacks"
    },
    shelfLifeDays: {
      type: Number,
      required: [true, "Shelf life in days is required"],
      min: 1
    },
    safetyStock: {
      type: Number,
      required: true,
      default: 50,
      min: 0
    },
    currentStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    productionRatePerHour: {
      type: Number,
      required: true,
      default: 50,
      min: 1
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);