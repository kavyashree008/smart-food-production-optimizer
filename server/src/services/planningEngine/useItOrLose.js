import { differenceInDays } from "date-fns";

/**
 * Identifies raw material batches nearing expiry (<= 7 days) and computes which
 * finished products can be manufactured immediately to consume those batches
 * before they expire, avoiding costly food waste.
 */
export function generateUseItOrLoseItSuggestions({
  expiringBatches = [],
  recipes = [],
  products = []
}) {
  const suggestions = [];
  const prodMap = {};
  products.forEach((p) => {
    prodMap[p._id.toString()] = p;
  });

  for (const batch of expiringBatches) {
    const rawId = batch.rawMaterialId?._id?.toString() || batch.rawMaterialId?.toString();
    const rawName = batch.rawMaterialId?.name || "Raw Material";
    const rawUnit = batch.rawMaterialId?.unit || "kg";
    const daysUntilExpiry = differenceInDays(new Date(batch.expiryDate), new Date());

    // Find recipes that require this raw material
    const matchingRecipes = recipes.filter((r) =>
      r.ingredients.some(
        (ing) => (ing.rawMaterialId?._id?.toString() || ing.rawMaterialId?.toString()) === rawId
      )
    );

    for (const recipe of matchingRecipes) {
      const prodId = recipe.productId?._id?.toString() || recipe.productId?.toString();
      const product = prodMap[prodId] || recipe.productId;
      if (!product) continue;

      const ingredient = recipe.ingredients.find(
        (ing) => (ing.rawMaterialId?._id?.toString() || ing.rawMaterialId?.toString()) === rawId
      );

      if (ingredient && ingredient.qtyPerUnit > 0) {
        // Calculate finished product quantity needed to consume the entire remaining batch
        const potentialProductQty = Math.round(batch.remainingQty / ingredient.qtyPerUnit);
        const estimatedWasteValue = Math.round(batch.remainingQty * (batch.costPerUnit || 0));

        suggestions.push({
          batchId: batch._id,
          batchNo: batch.batchNo,
          rawMaterialName: rawName,
          remainingQty: batch.remainingQty,
          unit: rawUnit,
          daysUntilExpiry,
          expiryDate: batch.expiryDate,
          estimatedWasteValue,
          suggestedProductId: product._id,
          suggestedProductName: product.name,
          suggestedProductCategory: product.category,
          recommendedProductionQuantity: potentialProductQty,
          recommendedAction: `Produce ${potentialProductQty} ${product.unit} of ${product.name} to fully consume batch ${batch.batchNo} before it expires in ${daysUntilExpiry} days.`
        });
      }
    }
  }

  // Sort by urgency (earliest expiry first, then highest waste value)
  return suggestions.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry || b.estimatedWasteValue - a.estimatedWasteValue);
}