import mongoose from "mongoose";

const simulationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Simulation scenario name is required"],
      trim: true
    },
    inputs: {
      demandChangePercent: { type: Number, default: 0 },
      supplierDelayDays: { type: Number, default: 0 },
      capacityChangePercent: { type: Number, default: 0 },
      urgentOrdersAdded: { type: Array, default: [] }
    },
    results: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

export const Simulation = mongoose.model("Simulation", simulationSchema);