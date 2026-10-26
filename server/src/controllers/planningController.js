import { ProductionPlan } from "../models/ProductionPlan.js";
import { Product } from "../models/Product.js";
import { Recipe } from "../models/Recipe.js";
import { Batch } from "../models/Batch.js";
import { AuditLog } from "../models/AuditLog.js";
import { runPlanningEngine } from "../services/planningEngine/replan.js";
import { checkMaterialAvailability } from "../services/planningEngine/materialCheck.js";
import { scheduleCapacity } from "../services/planningEngine/capacity.js";
import { calculatePlanRisk } from "../services/planningEngine/risk.js";
import { generatePlanExplanation } from "../services/planningEngine/explain.js";

export async function getRecommendations(req, res, next) {
  try {
    // Find latest version of each product plan
    let plans = await ProductionPlan.find()
      .populate("productId", "name sku unit category sellingPrice shelfLifeDays currentStock safetyStock productionRatePerHour")
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });

    // If no plans exist yet, auto-generate them
    if (plans.length === 0) {
      const io = req.app.get("io");
      await runPlanningEngine({
        changeReason: "Initial plan initialization",
        userId: req.user?._id,
        io
      });
      plans = await ProductionPlan.find()
        .populate("productId", "name sku unit category sellingPrice shelfLifeDays currentStock safetyStock productionRatePerHour")
        .populate("createdBy", "name role")
        .sort({ createdAt: -1 });
    }

    // Filter to return only the latest version per product
    const latestPlansMap = new Map();
    for (const plan of plans) {
      if (plan.productId) {
        const prodId = plan.productId._id.toString();
        if (!latestPlansMap.has(prodId)) {
          latestPlansMap.set(prodId, plan);
        }
      }
    }

    const latestPlans = Array.from(latestPlansMap.values());
    return res.status(200).json({ success: true, count: latestPlans.length, plans: latestPlans });
  } catch (error) {
    return next(error);
  }
}

export async function runPlanning(req, res, next) {
  try {
    const { changeReason, productId } = req.body;
    const io = req.app.get("io");

    const plans = await runPlanningEngine({
      productId: productId || null,
      changeReason: changeReason || "Manual re-run requested by user",
      userId: req.user?._id,
      io
    });

    return res.status(200).json({
      success: true,
      message: `Planning engine executed successfully for ${plans.length} products`,
      plans
    });
  } catch (error) {
    return next(error);
  }
}

export async function acceptPlan(req, res, next) {
  try {
    const plan = await ProductionPlan.findById(req.params.id).populate("productId");
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    plan.status = "accepted";
    await plan.save();

    await AuditLog.create({
      user: req.user?.name || "Manager",
      action: "PLAN_ACCEPTED",
      entity: `Plan ${plan._id} (${plan.productId?.name})`,
      after: { status: "accepted", quantity: plan.quantity }
    });

    const io = req.app.get("io");
    if (io) io.emit("plan:status_changed", plan);

    return res.status(200).json({ success: true, message: "Plan accepted into production schedule", plan });
  } catch (error) {
    return next(error);
  }
}

export async function modifyPlan(req, res, next) {
  try {
    const { quantity } = req.body;
    const plan = await ProductionPlan.findById(req.params.id).populate("productId");
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    const newQty = Number(quantity);
    const product = plan.productId;
    const recipe = await Recipe.findOne({ productId: product._id });

    // Live re-check of materials
    const batches = await Batch.find({ status: "active", remainingQty: { $gt: 0 } }).sort({ expiryDate: 1 });
    const batchesByMaterial = {};
    for (const b of batches) {
      const rawId = b.rawMaterialId.toString();
      if (!batchesByMaterial[rawId]) batchesByMaterial[rawId] = [];
      batchesByMaterial[rawId].push(b);
    }

    const materialResult = checkMaterialAvailability({
      recipe,
      requiredQuantity: newQty,
      batchesByMaterial
    });

    const capacityResult = scheduleCapacity({
      quantity: newQty,
      productionRatePerHour: product.productionRatePerHour
    });

    const shortageRisk = materialResult.canProduce ? 0.1 : 0.8;
    const deliveryRisk = capacityResult.isWithinDeliveryDeadline ? 0.15 : 0.75;
    const capacityRisk = Math.min(1, capacityResult.daysNeeded / 4);

    const riskResult = calculatePlanRisk({
      shortageRisk,
      deliveryRisk,
      capacityRisk,
      expiryRisk: 0.1
    });

    const newReasoning = generatePlanExplanation({
      productName: product.name,
      unit: product.unit,
      quantity: newQty,
      netReq: plan.inputsSnapshot?.netReq || {},
      materialResult,
      riskResult
    });

    // Create new version with modification
    const modifiedPlan = await ProductionPlan.create({
      productId: product._id,
      quantity: newQty,
      date: new Date(),
      status: "modified",
      reasoning: newReasoning,
      riskLevel: riskResult.riskLevel,
      riskScore: riskResult.riskScore,
      riskBreakdown: riskResult.riskBreakdown,
      inputsSnapshot: {
        ...plan.inputsSnapshot,
        materialResult,
        capacityResult,
        modifiedByUser: req.user?.name
      },
      createdBy: req.user?._id,
      version: plan.version + 1,
      previousVersionId: plan._id,
      changeReason: `Manually modified quantity from ${plan.quantity} to ${newQty} ${product.unit}`
    });

    await modifiedPlan.populate("productId");

    await AuditLog.create({
      user: req.user?.name || "Manager",
      action: "PLAN_MODIFIED",
      entity: `Plan ${modifiedPlan._id} (${product.name})`,
      before: { quantity: plan.quantity },
      after: { quantity: newQty }
    });

    const io = req.app.get("io");
    if (io) io.emit("plan:updated", modifiedPlan);

    return res.status(200).json({ success: true, message: "Plan modified successfully", plan: modifiedPlan });
  } catch (error) {
    return next(error);
  }
}

export async function rejectPlan(req, res, next) {
  try {
    const { reason } = req.body;
    const plan = await ProductionPlan.findById(req.params.id).populate("productId");
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    plan.status = "rejected";
    plan.changeReason = reason || "Rejected by manager";
    await plan.save();

    await AuditLog.create({
      user: req.user?.name || "Manager",
      action: "PLAN_REJECTED",
      entity: `Plan ${plan._id}`,
      after: { status: "rejected", reason: plan.changeReason }
    });

    return res.status(200).json({ success: true, message: "Plan marked as rejected", plan });
  } catch (error) {
    return next(error);
  }
}

export async function getPlanHistory(req, res, next) {
  try {
    const plan = await ProductionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    const history = await ProductionPlan.find({ productId: plan.productId })
      .populate("createdBy", "name role")
      .sort({ version: -1 });

    return res.status(200).json({ success: true, count: history.length, history });
  } catch (error) {
    return next(error);
  }
}