import { allocateBatchesFEFO } from "./fefo.js";

/**
 * Checks BOM ingredients required for target quantity against active batches using FEFO.
 */
export function checkMaterialAvailability({
  recipe,
  requiredQuantity = 0,
  batchesByMaterial = {},
  productionDate = new Date()
}) {
  if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
    return {
      canProduce: false,
      missingMaterials: ["Recipe not found or empty"],
      materialRequirements: []
    };
  }

  const materialRequirements = [];
  const missingMaterials = [];

  for (const ingredient of recipe.ingredients) {
    const rawId = ingredient.rawMaterialId?._id?.toString() || ingredient.rawMaterialId?.toString();
    const rawName = ingredient.rawMaterialId?.name || "Raw Material";
    const unit = ingredient.rawMaterialId?.unit || "kg";
    const qtyNeeded = Number((ingredient.qtyPerUnit * requiredQuantity).toFixed(2));

    const materialBatches = batchesByMaterial[rawId] || [];
    const fefoResult = allocateBatchesFEFO({
      batches: materialBatches,
      quantityNeeded: qtyNeeded,
      productionDate
    });

    materialRequirements.push({
      rawMaterialId: rawId,
      name: rawName,
      unit,
      qtyNeeded,
      totalAllocated: fefoResult.totalAllocated,
      shortfall: fefoResult.shortfall,
      allocatedBatches: fefoResult.allocatedBatches
    });

    if (!fefoResult.isFullyAllocated) {
      missingMaterials.push({
        rawMaterialId: rawId,
        name: rawName,
        shortfall: fefoResult.shortfall,
        unit
      });
    }
  }

  return {
    canProduce: missingMaterials.length === 0,
    missingMaterials,
    materialRequirements
  };
}