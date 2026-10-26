import { RISK_WEIGHTS, RISK_LEVELS, RISK_THRESHOLDS } from "../../config/constants.js";

/**
 * Calculates composite risk score and categorizes it into Low, Medium, or High.
 * Formula: 0.4 * shortage + 0.3 * delivery + 0.2 * capacity + 0.1 * expiry
 * Each input component is normalized between 0 and 1.
 */
export function calculatePlanRisk({
  shortageRisk = 0,
  deliveryRisk = 0,
  capacityRisk = 0,
  expiryRisk = 0
}) {
  // Clamp values to [0, 1]
  const clamp = (val) => Math.max(0, Math.min(1, Number(val || 0)));

  const sNorm = clamp(shortageRisk);
  const dNorm = clamp(deliveryRisk);
  const cNorm = clamp(capacityRisk);
  const eNorm = clamp(expiryRisk);

  const rawScore =
    RISK_WEIGHTS.SHORTAGE * sNorm +
    RISK_WEIGHTS.DELIVERY * dNorm +
    RISK_WEIGHTS.CAPACITY * cNorm +
    RISK_WEIGHTS.EXPIRY * eNorm;

  const riskScore = Number(rawScore.toFixed(3));

  let riskLevel = RISK_LEVELS.LOW;
  if (riskScore > RISK_THRESHOLDS.MEDIUM_MAX) {
    riskLevel = RISK_LEVELS.HIGH;
  } else if (riskScore >= RISK_THRESHOLDS.LOW_MAX) {
    riskLevel = RISK_LEVELS.MEDIUM;
  }

  return {
    riskScore,
    riskLevel,
    riskBreakdown: {
      shortage: Number(sNorm.toFixed(2)),
      delivery: Number(dNorm.toFixed(2)),
      capacity: Number(cNorm.toFixed(2)),
      expiry: Number(eNorm.toFixed(2))
    }
  };
}