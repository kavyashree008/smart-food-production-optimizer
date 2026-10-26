import { format, addDays } from "date-fns";

/**
 * Computes raw material procurement suggestions based on lead times,
 * active inventory, reorder levels, and projected consumption demand.
 */
export function generatePurchaseSuggestions({
  rawMaterials = [],
  activeBatches = [],
  projectedMaterialConsumption = {}
}) {
  const suggestions = [];
  const now = new Date();

  // Aggregate active stock per raw material
  const currentStockMap = {};
  for (const batch of activeBatches) {
    if (batch.status === "active" && new Date(batch.expiryDate) > now) {
      const rawId = batch.rawMaterialId?._id?.toString() || batch.rawMaterialId?.toString();
      currentStockMap[rawId] = (currentStockMap[rawId] || 0) + (batch.remainingQty || 0);
    }
  }

  for (const mat of rawMaterials) {
    const rawId = mat._id.toString();
    const currentStock = currentStockMap[rawId] || 0;
    const projectedDemand = projectedMaterialConsumption[rawId] || 0;
    const reorderLevel = mat.reorderLevel || 100;
    const leadTimeDays = mat.leadTimeDays || 2;

    const projectedRemaining = currentStock - projectedDemand;

    if (projectedRemaining <= reorderLevel) {
      const orderQty = Math.max(reorderLevel * 2, Math.round(projectedDemand * 1.5));
      const orderDeadline = addDays(now, Math.max(0, 3 - leadTimeDays));
      const stockoutExpectedDate = addDays(now, 3);

      const deadlineDayStr = format(orderDeadline, "EEEE (dd MMM)");
      const stockoutDayStr = format(stockoutExpectedDate, "EEEE (dd MMM)");

      suggestions.push({
        rawMaterialId: mat._id,
        name: mat.name,
        unit: mat.unit,
        supplier: mat.supplier,
        leadTimeDays,
        currentStock,
        projectedDemand,
        reorderLevel,
        suggestedOrderQuantity: orderQty,
        estimatedCost: Math.round(orderQty * (mat.costPerUnit || 0)),
        orderDeadline,
        stockoutExpectedDate,
        message: `Order ${orderQty} ${mat.unit} of ${mat.name} by ${deadlineDayStr} or stockout anticipated by ${stockoutDayStr}.`
      });
    }
  }

  return suggestions;
}