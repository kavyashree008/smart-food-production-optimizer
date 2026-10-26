import { calculateRequiredQuantity } from "../src/services/planningEngine/requiredQuantity.js";

describe("Planning Engine: requiredQuantity.js", () => {
  test("calculates standard net requirement: forecast + orders + safety - stock", () => {
    const res = calculateRequiredQuantity({
      forecastDemand: 200,
      confirmedOrders: [{ qty: 50 }, { qty: 30 }],
      safetyStock: 40,
      currentFinishedStock: 70,
      alreadyScheduledProduction: 20,
      shelfLifeDays: 60,
      avgDailyDemand: 40
    });

    // Gross = 200 + 80 = 280
    // Net = 280 + 40 - 70 - 20 = 230
    expect(res.requiredQuantity).toBe(230);
    expect(res.grossDemand).toBe(280);
    expect(res.ordersDemand).toBe(80);
    expect(res.isCappedByShelfLife).toBe(false);
  });

  test("never returns negative required quantity when stock exceeds demand", () => {
    const res = calculateRequiredQuantity({
      forecastDemand: 50,
      confirmedOrders: [],
      safetyStock: 20,
      currentFinishedStock: 200,
      alreadyScheduledProduction: 0
    });

    expect(res.requiredQuantity).toBe(0);
    expect(res.netBeforeCap).toBe(-130);
  });

  test("caps required quantity to shelfLifeDays * avgDailyDemand", () => {
    // Highly perishable product: 3 days shelf life, avg daily demand 20 -> max allowed 60
    const res = calculateRequiredQuantity({
      forecastDemand: 300,
      confirmedOrders: [{ qty: 100 }],
      safetyStock: 50,
      currentFinishedStock: 10,
      alreadyScheduledProduction: 0,
      shelfLifeDays: 3,
      avgDailyDemand: 20
    });

    // Net before cap = 400 + 50 - 10 = 440
    // Max cap = 3 * 20 = 60
    expect(res.isCappedByShelfLife).toBe(true);
    expect(res.requiredQuantity).toBe(60);
    expect(res.maxAllowedByShelfLife).toBe(60);
  });
});