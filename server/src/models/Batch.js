import mongoose from "mongoose";
import { BATCH_STATUS } from "../config/constants.js";

const batchSchema = new mongoose.Schema(
  {
    rawMaterialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RawMaterial",
      required: [true, "Raw material reference is required"]
    },
    batchNo: {
      type: String,
      required: [true, "Batch number is required"],
      unique: true,
      uppercase: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    remainingQty: {
      type: Number,
      required: true,
      min: 0
    },
    receivedDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"]
    },
    costPerUnit: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: Object.values(BATCH_STATUS),
      default: BATCH_STATUS.ACTIVE
    }
  },
  { timestamps: true }
);

// Virtual for checking if batch is expired
batchSchema.virtual("isExpired").get(function () {
  return new Date() > this.expiryDate;
});

export const Batch = mongoose.model("Batch", batchSchema);