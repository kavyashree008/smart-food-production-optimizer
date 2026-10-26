import mongoose from "mongoose";

const rawMaterialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Raw material name is required"],
      trim: true,
      unique: true
    },
    unit: {
      type: String,
      required: true,
      default: "kg"
    },
    supplier: {
      type: String,
      required: true,
      trim: true
    },
    leadTimeDays: {
      type: Number,
      required: true,
      default: 2,
      min: 0
    },
    reorderLevel: {
      type: Number,
      required: true,
      default: 100,
      min: 0
    },
    costPerUnit: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

export const RawMaterial = mongoose.model("RawMaterial", rawMaterialSchema);