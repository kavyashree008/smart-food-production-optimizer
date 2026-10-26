import { calculatePlanRisk } from "../src/services/planningEngine/risk.js";
import { RISK_LEVELS } from "../src/config/constants.js";

describe("Planning Engine: risk.js", () => {
  test("computes composite risk with specified weights (0.4 shortage + 0.3 delivery + 0.2 capacity + 0.1 expiry)", () => {
    const res = calculatePlanRisk({
      shortageRisk: 0.5, // 0.4 * 0.5 = 0.20
      deliveryRisk: 0.4, // 0.3 * 0.4 = 0.12
      capacityRisk: 0.3, // 0.2 * 0.3 = 0.06
      expiryRisk: 0.2    // 0.1 * 0.2 = 0.02
    });

    // Total = 0.20 + 0.12 + 0.06 + 0.02 = 0.40
    expect(res.riskScore).toBeCloseTo(0.40);
    expect(res.riskLevel).toBe(RISK_LEVELS.MEDIUM); // 0.33 to 0.66 is Medium
  });

  test("categorizes risk levels: Low (<0.33), Medium (0.33-0.66), High (>0.66)", () => {
    const low = calculatePlanRisk({ shortageRisk: 0.1, deliveryRisk: 0.1, capacityRisk: 0.1, expiryRisk: 0.1 });
    expect(low.riskLevel).toBe(RISK_LEVELS.LOW);
    expect(low.riskScore).toBeLessThan(0.33);

    const high = calculatePlanRisk({ shortageRisk: 0.9, deliveryRisk: 0.8, capacityRisk: 0.7, expiryRisk: 0.5 });
    expect(high.riskLevel).toBe(RISK_LEVELS.HIGH);
    expect(high.riskScore).toBeGreaterThan(0.66);
  });

  test("clamps inputs between 0 and 1", () => {
    const res = calculatePlanRisk({
      shortageRisk: 2.5,
      deliveryRisk: -0.5,
      capacityRisk: 1.0,
      expiryRisk: 0.0
    });

    // 0.4*1.0 + 0.3*0.0 + 0.2*1.0 + 0.1*0.0 = 0.60
    expect(res.riskScore).toBeCloseTo(0.60);
    expect(res.riskBreakdown.shortage).toBe(1);
    expect(res.riskBreakdown.delivery).toBe(0);
  });
});