import { allocateBatchesFEFO } from "../src/services/planningEngine/fefo.js";

describe("Planning Engine: fefo.js", () => {
  const mockBatches = [
    {
      _id: "batch-3",
      batchNo: "BAT-003",
      remainingQty: 100,
      expiryDate: new Date("2026-10-20"),
      status: "active",
      costPerUnit: 50
    },
    {
      _id: "batch-1",
      batchNo: "BAT-001",
      remainingQty: 40,
      expiryDate: new Date("2026-10-05"), // Earliest expiry!
      status: "active",
      costPerUnit: 50
    },
    {
      _id: "batch-2",
      batchNo: "BAT-002",
      remainingQty: 50,
      expiryDate: new Date("2026-10-10"), // Second earliest
      status: "active",
      costPerUnit: 50
    }
  ];

  test("allocates batches strictly in FEFO order (earliest expiry first)", () => {
    const res = allocateBatchesFEFO({
      batches: mockBatches,
      quantityNeeded: 60,
      productionDate: new Date("2026-10-01")
    });

    expect(res.isFullyAllocated).toBe(true);
    expect(res.totalAllocated).toBe(60);
    expect(res.shortfall).toBe(0);
    expect(res.allocatedBatches.length).toBe(2);

    // 1st batch consumed: BAT-001 (40 kg consumed, 0 remaining)
    expect(res.allocatedBatches[0].batchNo).toBe("BAT-001");
    expect(res.allocatedBatches[0].allocatedQty).toBe(40);
    expect(res.allocatedBatches[0].remainingAfter).toBe(0);

    // 2nd batch consumed: BAT-002 (20 kg consumed, 30 remaining)
    expect(res.allocatedBatches[1].batchNo).toBe("BAT-002");
    expect(res.allocatedBatches[1].allocatedQty).toBe(20);
    expect(res.allocatedBatches[1].remainingAfter).toBe(30);
  });

  test("calculates shortfall when total batch quantity is insufficient", () => {
    const res = allocateBatchesFEFO({
      batches: mockBatches,
      quantityNeeded: 250, // Total available is 40 + 50 + 100 = 190
      productionDate: new Date("2026-10-01")
    });

    expect(res.isFullyAllocated).toBe(false);
    expect(res.totalAllocated).toBe(190);
    expect(res.shortfall).toBe(60);
  });

  test("ignores expired batches or batches that expire before production date", () => {
    const res = allocateBatchesFEFO({
      batches: mockBatches,
      quantityNeeded: 50,
      productionDate: new Date("2026-10-12") // BAT-001 (10-05) and BAT-002 (10-10) are expired before this date!
    });

    // Only BAT-003 is usable
    expect(res.allocatedBatches.length).toBe(1);
    expect(res.allocatedBatches[0].batchNo).toBe("BAT-003");
    expect(res.allocatedBatches[0].allocatedQty).toBe(50);
  });
});