/**
 * Calculates net required production quantity, taking into account forecast demand,
 * confirmed customer orders, safety stock levels, existing finished goods stock,
 * and caps the volume by finished-goods shelf life to prevent finished-product spoilage.
 */
export function calculateRequiredQuantity({
  forecastDemand = 0,
  confirmedOrders = [],
  safetyStock = 0,
  currentFinishedStock = 0,
  alreadyScheduledProduction = 0,
  shelfLifeDays = 30,
  avgDailyDemand = 0,
  horizonDays = 7
}) {
  // Aggregate confirmed order quantity due within horizonDays
  const ordersDemand = confirmedOrders.reduce((sum, order) => {
    // Each order item quantity
    const orderQty = order.items
      ? order.items.reduce((s, it) => s + (it.qty || 0), 0)
      : (order.qty || 0);
    return sum + orderQty;
  }, 0);

  // Net requirement calculation
  const grossDemand = forecastDemand + ordersDemand;
  const netBeforeCap = grossDemand + safetyStock - currentFinishedStock - alreadyScheduledProduction;

  // Shelf-life constraint:
  // Producing more than what can be consumed within its shelf life guarantees spoilage.
  const effectiveDailyDemand = avgDailyDemand > 0 ? avgDailyDemand : Math.max(1, forecastDemand / (horizonDays || 7));
  const maxAllowedByShelfLife = Math.round(shelfLifeDays * effectiveDailyDemand);

  let requiredQuantity = Math.max(0, netBeforeCap);
  let isCappedByShelfLife = false;

  if (requiredQuantity > maxAllowedByShelfLife && maxAllowedByShelfLife > 0) {
    requiredQuantity = maxAllowedByShelfLife;
    isCappedByShelfLife = true;
  }

  return {
    requiredQuantity: Math.round(requiredQuantity),
    netBeforeCap: Math.round(netBeforeCap),
    grossDemand: Math.round(grossDemand),
    forecastDemand: Math.round(forecastDemand),
    ordersDemand: Math.round(ordersDemand),
    safetyStock: Math.round(safetyStock),
    currentStock: Math.round(currentFinishedStock),
    alreadyScheduled: Math.round(alreadyScheduledProduction),
    isCappedByShelfLife,
    maxAllowedByShelfLife
  };
}