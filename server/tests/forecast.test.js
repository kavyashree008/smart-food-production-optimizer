import {
  calculateSES,
  calculateMovingAverage,
  calculateMAPE,
  generateDemandForecast
} from "../src/services/planningEngine/forecast.js";

describe("Planning Engine: forecast.js", () => {
  test("calculateSES smooths series according to alpha parameter", () => {
    const data = [100, 120, 110, 130];
    const alpha = 0.3;
    const res = calculateSES(data, alpha);

    expect(res.length).toBe(4);
    expect(res[0]).toBe(100);
    // t=1: 0.3*120 + 0.7*100 = 36 + 70 = 106
    expect(res[1]).toBeCloseTo(106);
    // t=2: 0.3*110 + 0.7*106 = 33 + 74.2 = 107.2
    expect(res[2]).toBeCloseTo(107.2);
  });

  test("calculateMovingAverage computes window average correctly", () => {
    const data = [10, 20, 30, 40, 50, 60, 70, 80];
    const res = calculateMovingAverage(data, 7);

    expect(res.length).toBe(8);
    // Index 6 (7th item) average of [10..70] = 280 / 7 = 40
    expect(res[6]).toBe(40);
    // Index 7 (8th item) average of [20..80] = 350 / 7 = 50
    expect(res[7]).toBe(50);
  });

  test("calculateMAPE returns 0 for identical series and correct percentage for errors", () => {
    const actuals = [100, 200];
    const forecasts = [100, 200];
    expect(calculateMAPE(actuals, forecasts)).toBe(0);

    const badForecasts = [110, 180]; // 10% error on both
    expect(calculateMAPE(actuals, badForecasts)).toBeCloseTo(10);
  });

  test("generateDemandForecast chooses lower MAPE method and applies festival multipliers", () => {
    // Generate 30 days of sales history with steady 50 units
    const history = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2026, 0, i + 1),
      quantitySold: 50 + (i % 2 === 0 ? 5 : -5)
    }));

    const festivals = [
      {
        name: "Test Festival",
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 10 * 86400000),
        demandMultiplier: 2.0,
        productCategories: ["Sweets"]
      }
    ];

    const result = generateDemandForecast({
      salesHistory: history,
      horizonDays: 7,
      festivals,
      productCategory: "Sweets"
    });

    expect(result.chosenMethod).toBeDefined();
    expect(result.dailyForecast.length).toBe(7);
    expect(result.accuracyPercent).toBeGreaterThan(70);
    // Since festival multiplier is 2.0, projected daily should be roughly ~100
    expect(result.dailyForecast[0]).toBeGreaterThan(80);
  });
});