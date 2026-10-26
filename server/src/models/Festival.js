import mongoose from "mongoose";

const festivalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Festival name is required"],
      unique: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    demandMultiplier: {
      type: Number,
      required: true,
      default: 1.5,
      min: 1
    },
    productCategories: {
      type: [String],
      required: true,
      default: ["Sweets", "Snacks"]
    }
  },
  { timestamps: true }
);

export const Festival = mongoose.model("Festival", festivalSchema);