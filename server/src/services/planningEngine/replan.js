import { Product } from "../../models/Product.js";
import { RawMaterial } from "../../models/RawMaterial.js";
import { Batch } from "../../models/Batch.js";
import { Recipe } from "../../models/Recipe.js";
import { SalesHistory } from "../../models/SalesHistory.js";
import { Order } from "../../models/Order.js";
import { Festival } from "../../models/Festival.js";
import { ProductionPlan } from "../../models/ProductionPlan.js";
import { Alert } from "../../models/Alert.js";
import { AuditLog } from "../../models/AuditLog.js";

import { generateDemandForecast } from "./forecast.js";
import { calculateRequiredQuantity } from "./requiredQuantity.js";
import { checkMaterialAvailability } from "./materialCheck.js";
import { scheduleCapacity } from "./capacity.js";
import { calculatePlanRisk } from "./risk.js";
import { generatePlanExplanation } from "./explain.js";

/**
 * Executes a full or single-product planning run across all data sources,
 * saves new plans with version increments and change reasons, and emits real-time updates.
 */
export async function runPlanningEngine({
  productId = null,
  changeReason = "Scheduled production re-evaluation",
  userId = null,
  io = null
} = {}) {
  const productFilter = productId ? { _id: productId } : {};
  const products = await Product.find(productFilter);

  const [rawMaterials, allBatches, recipes, festivals, confirmedOrders] = await Promise.all([
    RawMaterial.find(),
    Batch.find({ status: "active", remainingQty: { $gt: 0 } }).sort({ expiryDate: 1 }),
    Recipe.find().populate("ingredients.rawMaterialId"),
    Festival.find(),
    Order.find({ status: { $in: ["confirmed", "pending"] } })
  ]);

  // Group active batches by rawMaterialId for fast lookups
  const batchesByMaterial = {};
  for (const batch of allBatches) {
    const rawId = batch.rawMaterialId.toString();
    if (!batchesByMaterial[rawId]) batchesByMaterial[rawId] = [];
    batchesByMaterial[rawId].push(batch);
  }

  const generatedPlans = [];

  for (const product of products) {
    const pId = product._id.toString();

    // 1. Fetch 90-day sales history
    const sales = await SalesHistory.find({ productId: product._id }).sort({ date: 1 });

    // 2. Generate Demand Forecast (SES vs 7-day MA with festival multiplier)
    const forecastResult = generateDemandForecast({
      salesHistory: sales,
      festivals,
      productCategory: product.category
    });

    // 3. Relevant confirmed orders for this product
    const relevantOrders = confirmedOrders.filter((ord) =>
      ord.items.some((it) => it.productId.toString() === pId)
    );

    // 4. Calculate Net Required Quantity with Shelf-Life Capping
    const netReq = calculateRequiredQuantity({
      forecastDemand: forecastResult.totalForecastQuantity,
      confirmedOrders: relevantOrders,
      safetyStock: product.safetyStock,
      currentFinishedStock: product.currentStock,
      shelfLifeDays: product.shelfLifeDays,
      avgDailyDemand: forecastResult.totalForecastQuantity / 7
    });

    // 5. Check BOM Materials using FEFO
    const recipe = recipes.find((r) => r.productId.toString() === pId);
    const materialResult = checkMaterialAvailability({
      recipe,
      requiredQuantity: netReq.requiredQuantity,
      batchesByMaterial
    });

    // 6. Line Capacity Scheduling
    const capacityResult = scheduleCapacity({
      quantity: netReq.requiredQuantity,
      productionRatePerHour: product.productionRatePerHour
    });

    // 7. Composite Risk Evaluation
    const shortageRisk = materialResult.canProduce ? 0.08 : 0.85;
    const deliveryRisk = capacityResult.isWithinDeliveryDeadline ? 0.12 : 0.78;
    const capacityRisk = Math.min(1, capacityResult.daysNeeded / 4);
    // Check if any allocated batch is expiring within 3 days
    const hasCriticalExpiryBatch = materialResult.materialRequirements.some((mr) =>
      mr.allocatedBatches.some((ab) => {
        const days = (new Date(ab.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
        return days <= 3;
      })
    );
    const expiryRisk = hasCriticalExpiryBatch ? 0.65 : 0.1;

    const riskResult = calculatePlanRisk({
      shortageRisk,
      deliveryRisk,
      capacityRisk,
      expiryRisk
    });

    // 8. Generate Deterministic Explanation
    const reasoning = generatePlanExplanation({
      productName: product.name,
      unit: product.unit,
      quantity: netReq.requiredQuantity,
      netReq,
      materialResult,
      riskResult
    });

    // 9. Versioning: Find latest existing plan for this product
    const existingPlan = await ProductionPlan.findOne({ productId: product._id }).sort({ version: -1 });
    const nextVersion = existingPlan ? existingPlan.version + 1 : 1;
    const previousVersionId = existingPlan ? existingPlan._id : null;

    // 10. Persist new Production Plan
    const newPlan = await ProductionPlan.create({
      productId: product._id,
      quantity: netReq.requiredQuantity,
      date: new Date(),
      status: "recommended",
      reasoning,
      riskLevel: riskResult.riskLevel,
      riskScore: riskResult.riskScore,
      riskBreakdown: riskResult.riskBreakdown,
      inputsSnapshot: {
        forecastResult,
        netReq,
        materialResult,
        capacityResult,
        productStock: product.currentStock,
        safetyStock: product.safetyStock
      },
      createdBy: userId,
      version: nextVersion,
      previousVersionId,
      changeReason
    });

    await newPlan.populate("productId", "name sku unit category sellingPrice shelfLifeDays");
    generatedPlans.push(newPlan);
  }

  // Real-time broadcast
  if (io) {
    io.emit("plan:updated", {
      plansCount: generatedPlans.length,
      changeReason,
      timestamp: new Date()
    });
  }

  // Audit Log
  await AuditLog.create({
    user: userId ? "User" : "PlanningEngine",
    action: "PLAN_REGENERATED",
    entity: `ProductionPlans (${generatedPlans.length} products)`,
    after: { changeReason, plansCount: generatedPlans.length }
  });

  return generatedPlans;
}