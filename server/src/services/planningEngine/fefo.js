/**
 * First-Expired, First-Out (FEFO) batch allocation algorithm.
 * Sorts available batches by expiryDate ascending so batches nearest to expiry
 * are consumed first, minimizing ingredient spoilage.
 */
export function allocateBatchesFEFO({
  batches = [],
  quantityNeeded = 0,
  productionDate = new Date()
}) {
  if (quantityNeeded <= 0) {
    return {
      allocatedBatches: [],
      totalAllocated: 0,
      shortfall: 0,
      isFullyAllocated: true
    };
  }

  const prodTime = new Date(productionDate).getTime();

  // Filter only active batches that have not expired and will not expire before production date
  const usableBatches = batches
    .filter((b) => {
      const isStatusActive = b.status === "active";
      const hasStock = (b.remainingQty || 0) > 0;
      const expiryTime = new Date(b.expiryDate).getTime();
      return isStatusActive && hasStock && expiryTime >= prodTime;
    })
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

  let remainingNeeded = quantityNeeded;
  let totalAllocated = 0;
  const allocatedBatches = [];

  for (const batch of usableBatches) {
    if (remainingNeeded <= 0) break;

    const available = batch.remainingQty;
    const allocation = Math.min(available, remainingNeeded);

    allocatedBatches.push({
      batchId: batch._id,
      batchNo: batch.batchNo,
      allocatedQty: Number(allocation.toFixed(2)),
      costPerUnit: batch.costPerUnit || 0,
      expiryDate: batch.expiryDate,
      remainingAfter: Number((available - allocation).toFixed(2))
    });

    totalAllocated += allocation;
    remainingNeeded -= allocation;
  }

  const shortfall = Math.max(0, Number(remainingNeeded.toFixed(2)));

  return {
    allocatedBatches,
    totalAllocated: Number(totalAllocated.toFixed(2)),
    shortfall,
    isFullyAllocated: shortfall === 0
  };
}