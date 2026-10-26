/**
 * Generates a deterministic, explainable plain-text explanation derived strictly
 * from the calculated mathematical inputs and FEFO material allocation numbers.
 */
export function generatePlanExplanation({
  productName = "Product",
  unit = "kg",
  quantity = 0,
  netReq = {},
  materialResult = {},
  riskResult = {},
  productionDate = new Date()
}) {
  const dateStr = new Date(productionDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  const {
    forecastDemand = 0,
    ordersDemand = 0,
    safetyStock = 0,
    currentStock = 0,
    isCappedByShelfLife = false,
    maxAllowedByShelfLife = 0
  } = netReq;

  const { canProduce = true, missingMaterials = [] } = materialResult;
  const { riskScore = 0, riskLevel = "low" } = riskResult;

  let explanation = `Recommended production of ${quantity} ${unit} for ${productName} on ${dateStr}. `;
  explanation += `Driven by ${forecastDemand} ${unit} forecasted demand and ${ordersDemand} ${unit} confirmed orders, maintaining ${safetyStock} ${unit} safety buffer against ${currentStock} ${unit} available inventory. `;

  if (isCappedByShelfLife) {
    explanation += `Volume was capped at ${maxAllowedByShelfLife} ${unit} to prevent exceeding finished-product shelf life. `;
  }

  if (canProduce) {
    explanation += `All required raw ingredients are fully secured via FEFO batch allocation. `;
  } else {
    const missingNames = missingMaterials.map((m) => `${m.name} (${m.shortfall} ${m.unit})`).join(", ");
    explanation += `Alert: Raw material shortfall detected for ${missingNames}. `;
  }

  explanation += `Overall production plan risk is rated ${riskLevel.toUpperCase()} (score: ${riskScore}).`;

  return explanation;
}