import { generateDemandForecast } from "./forecast.js";
import { calculateRequiredQuantity } from "./requiredQuantity.js";
import { checkMaterialAvailability } from "./materialCheck.js";
import { scheduleCapacity } from "./capacity.js";
import { calculatePlanRisk } from "./risk.js";

/**
 * Runs a pure, isolated simulation on cloned inputs without modifying live database state.
 */
export function runSimulationEngine({
  livePlans = [],
  products = [],
  recipes = [],
  batches = [],
  salesHistories = {},
  orders = [],
  festivals = [],
  inputs = {
    demandChangePercent: 0,
    supplierDelayDays: 0,
    capacityChangePercent: 0,
    urgentOrdersAdded: []
  }
}) {
  const {
    demandChangePercent = 0,
    supplierDelayDays = 0,
    capacityChangePercent = 0,
    urgentOrdersAdded = []
  } = inputs;

  const demandFactor = 1 + demandChangePercent / 100;
  const capacityFactor = 1 + capacityChangePercent / 100;

  // Clone batches and apply simulated supplier delay to incoming inventory
  const simBatches = batches.map((b) => ({
    ...b,
    expiryDate: new Date(b.expiryDate)
  }));

  const batchesByMaterial = {};
  for (const b of simBatches) {
    const rawId = b.rawMaterialId?._id?.toString() || b.rawMaterialId?.toString();
    if (!batchesByMaterial[rawId]) batchesByMaterial[rawId] = [];
    batchesByMaterial[rawId].push(b);
  }

  // Combine live orders with simulated urgent orders
  const allOrders = [...orders, ...urgentOrdersAdded];

  const simulatedPlans = [];
  let totalLiveQty = 0;
  let totalSimQty = 0;
  let totalLiveRisk = 0;
  let totalSimRisk = 0;

  for (const product of products) {
    const prodId = product._id.toString();
    const productSales = salesHistories[prodId] || [];
    const recipe = recipes.find((r) => (r.productId?._id?.toString() || r.productId?.toString()) === prodId);

    // 1. Forecast with simulated demand multiplier
    const forecastResult = generateDemandForecast({
      salesHistory: productSales,
      festivals,
      productCategory: product.category
    });
    const simulatedForecastDemand = Math.round(forecastResult.totalForecastQuantity * demandFactor);

    // 2. Orders for this product
    const productOrders = allOrders.filter((o) =>
      o.items?.some((it) => (it.productId?._id?.toString() || it.productId?.toString()) === prodId)
    );

    // 3. Required quantity
    const netReq = calculateRequiredQuantity({
      forecastDemand: simulatedForecastDemand,
      confirmedOrders: productOrders,
      safetyStock: product.safetyStock,
      currentFinishedStock: product.currentStock,
      shelfLifeDays: product.shelfLifeDays
    });

    // 4. Material availability
    const matResult = checkMaterialAvailability({
      recipe,
      requiredQuantity: netReq.requiredQuantity,
      batchesByMaterial
    });

    // 5. Capacity with simulated factor
    const simRate = product.productionRatePerHour * capacityFactor;
    const capResult = scheduleCapacity({
      quantity: netReq.requiredQuantity,
      productionRatePerHour: simRate
    });

    // 6. Risk evaluation
    const shortageRisk = matResult.canProduce ? 0.1 : 0.8;
    const deliveryRisk = capResult.isWithinDeliveryDeadline ? 0.15 : 0.75;
    const capacityRisk = Math.min(1, capResult.daysNeeded / 5);
    const expiryRisk = supplierDelayDays > 3 ? 0.6 : 0.1;

    const riskResult = calculatePlanRisk({
      shortageRisk,
      deliveryRisk,
      capacityRisk,
      expiryRisk
    });

    const liveMatch = livePlans.find((p) => (p.productId?._id?.toString() || p.productId?.toString()) === prodId);
    const liveQty = liveMatch ? liveMatch.quantity : 0;
    const liveRiskScore = liveMatch ? liveMatch.riskScore : 0.2;

    totalLiveQty += liveQty;
    totalSimQty += netReq.requiredQuantity;
    totalLiveRisk += liveRiskScore;
    totalSimRisk += riskResult.riskScore;

    simulatedPlans.push({
      productId: product._id,
      productName: product.name,
      category: product.category,
      liveQuantity: liveQty,
      simulatedQuantity: netReq.requiredQuantity,
      quantityDelta: netReq.requiredQuantity - liveQty,
      liveRiskScore,
      simulatedRiskScore: riskResult.riskScore,
      riskDelta: Number((riskResult.riskScore - liveRiskScore).toFixed(3)),
      riskLevel: riskResult.riskLevel,
      canProduce: matResult.canProduce,
      missingMaterials: matResult.missingMaterials,
      capacityDaysNeeded: capResult.daysNeeded
    });
  }

  const avgLiveRisk = products.length > 0 ? Number((totalLiveRisk / products.length).toFixed(3)) : 0;
  const avgSimRisk = products.length > 0 ? Number((totalSimRisk / products.length).toFixed(3)) : 0;

  return {
    summary: {
      totalLiveQuantity: totalLiveQty,
      totalSimulatedQuantity: totalSimQty,
      quantityDelta: totalSimQty - totalLiveQty,
      avgLiveRisk,
      avgSimulatedRisk: avgSimRisk,
      riskDelta: Number((avgSimRisk - avgLiveRisk).toFixed(3)),
      criticalShortagesCount: simulatedPlans.filter((p) => !p.canProduce).length
    },
    simulatedPlans
  };
}