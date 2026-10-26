import { Simulation } from "../models/Simulation.js";
import { Product } from "../models/Product.js";
import { Recipe } from "../models/Recipe.js";
import { Batch } from "../models/Batch.js";
import { SalesHistory } from "../models/SalesHistory.js";
import { Order } from "../models/Order.js";
import { Festival } from "../models/Festival.js";
import { ProductionPlan } from "../models/ProductionPlan.js";
import { runSimulationEngine } from "../services/planningEngine/simulator.js";

export async function runSimulation(req, res, next) {
  try {
    const demandChangePercent = req.body.demandChangePercent ?? req.body.demandChangePct ?? 0;
    const supplierDelayDays = req.body.supplierDelayDays ?? 0;
    const capacityChangePercent = req.body.capacityChangePercent ?? req.body.capacityChangePct ?? 0;
    const urgentOrdersAdded = req.body.urgentOrdersAdded ?? (req.body.urgentOrder ? [req.body.urgentOrder] : []);

    const [products, recipes, batches, orders, festivals, livePlans] = await Promise.all([
      Product.find(),
      Recipe.find().populate("ingredients.rawMaterialId"),
      Batch.find({ status: "active", remainingQty: { $gt: 0 } }).lean(),
      Order.find({ status: { $in: ["confirmed", "pending"] } }).lean(),
      Festival.find().lean(),
      ProductionPlan.find().sort({ createdAt: -1 }).lean()
    ]);

    const salesHistories = {};
    for (const p of products) {
      salesHistories[p._id.toString()] = await SalesHistory.find({ productId: p._id }).sort({ date: 1 }).lean();
    }

    const simulationResult = runSimulationEngine({
      livePlans,
      products,
      recipes,
      batches,
      salesHistories,
      orders,
      festivals,
      inputs: {
        demandChangePercent: Number(demandChangePercent),
        supplierDelayDays: Number(supplierDelayDays),
        capacityChangePercent: Number(capacityChangePercent),
        urgentOrdersAdded: Array.isArray(urgentOrdersAdded) ? urgentOrdersAdded : []
      }
    });

    // Provide friendly aliases for the UI
    const comparison = (simulationResult.simulatedPlans || []).map((p) => ({
      productId: p.productId,
      productName: p.productName,
      liveQty: p.liveQuantity,
      simQty: p.simulatedQuantity,
      delta: p.quantityDelta,
      simRiskLevel: p.riskLevel,
      simRiskScore: p.simulatedRiskScore,
      canProduce: p.canProduce
    }));

    const liveSummary = {
      totalQty: simulationResult.summary.totalLiveQuantity,
      avgRiskScore: simulationResult.summary.avgLiveRisk
    };

    const simSummary = {
      totalQty: simulationResult.summary.totalSimulatedQuantity,
      avgRiskScore: simulationResult.summary.avgSimulatedRisk,
      criticalShortagesCount: simulationResult.summary.criticalShortagesCount
    };

    return res.status(200).json({
      success: true,
      ...simulationResult,
      comparison,
      liveSummary,
      simSummary
    });
  } catch (error) {
    return next(error);
  }
}

export async function saveSimulation(req, res, next) {
  try {
    const { name, inputs, results } = req.body;
    const sim = await Simulation.create({
      name,
      inputs,
      results,
      createdBy: req.user?._id
    });
    return res.status(201).json({ success: true, message: "Scenario saved", simulation: sim });
  } catch (error) {
    return next(error);
  }
}

export async function getSimulationHistory(req, res, next) {
  try {
    const history = await Simulation.find()
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(20);
    return res.status(200).json({ success: true, count: history.length, history });
  } catch (error) {
    return next(error);
  }
}