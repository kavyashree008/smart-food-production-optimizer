import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["shortage", "expiry", "delivery", "capacity", "anomaly", "delay"]
    },
    severity: {
      type: String,
      required: true,
      enum: ["info", "warning", "critical"],
      default: "warning"
    },
    message: {
      type: String,
      required: [true, "Alert message is required"],
      trim: true
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const Alert = mongoose.model("Alert", alertSchema);