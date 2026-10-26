import mongoose from "mongoose";
import { PLAN_STATUS, RISK_LEVELS } from "../config/constants.js";

const riskBreakdownSchema = new mongoose.Schema(
  {
    shortage: { type: Number, default: 0 },
    delivery: { type: Number, default: 0 },
    capacity: { type: Number, default: 0 },
    expiry: { type: Number, default: 0 }
  },
  { _id: false }
);

const productionPlanSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    status: {
      type: String,
      enum: Object.values(PLAN_STATUS),
      default: PLAN_STATUS.RECOMMENDED
    },
    reasoning: {
      type: String,
      default: ""
    },
    aiExplanation: {
      type: String,
      default: null
    },
    riskLevel: {
      type: String,
      enum: Object.values(RISK_LEVELS),
      default: RISK_LEVELS.LOW
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    riskBreakdown: {
      type: riskBreakdownSchema,
      default: () => ({})
    },
    inputsSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    version: {
      type: Number,
      default: 1
    },
    previousVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductionPlan",
      default: null
    },
    changeReason: {
      type: String,
      default: "Initial system recommendation"
    }
  },
  { timestamps: true }
);

export const ProductionPlan = mongoose.model("ProductionPlan", productionPlanSchema);