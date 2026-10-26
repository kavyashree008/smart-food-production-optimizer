import { Batch } from "../models/Batch.js";
import { RawMaterial } from "../models/RawMaterial.js";
import { WasteLog } from "../models/WasteLog.js";
import { Alert } from "../models/Alert.js";
import { AuditLog } from "../models/AuditLog.js";

export async function getBatches(req, res, next) {
  try {
    const { status, rawMaterialId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (rawMaterialId) filter.rawMaterialId = rawMaterialId;

    // FEFO: sorted by earliest expiry date first
    const batches = await Batch.find(filter)
      .populate("rawMaterialId", "name unit supplier costPerUnit reorderLevel")
      .sort({ expiryDate: 1 });

    return res.status(200).json({ success: true, count: batches.length, batches });
  } catch (error) {
    return next(error);
  }
}

export async function getExpiringSoon(req, res, next) {
  try {
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + 7);

    const expiringBatches = await Batch.find({
      status: "active",
      remainingQty: { $gt: 0 },
      expiryDate: { $gte: today, $lte: thresholdDate }
    })
      .populate("rawMaterialId", "name unit supplier")
      .sort({ expiryDate: 1 });

    return res.status(200).json({
      success: true,
      count: expiringBatches.length,
      batches: expiringBatches
    });
  } catch (error) {
    return next(error);
  }
}

export async function createBatch(req, res, next) {
  try {
    const { rawMaterialId, batchNo, quantity, receivedDate, expiryDate, costPerUnit } = req.body;
    
    const rawMaterial = await RawMaterial.findById(rawMaterialId);
    if (!rawMaterial) {
      return res.status(404).json({ success: false, message: "Raw material not found" });
    }

    const batch = await Batch.create({
      rawMaterialId,
      batchNo,
      quantity,
      remainingQty: quantity,
      receivedDate: receivedDate || new Date(),
      expiryDate,
      costPerUnit: costPerUnit || rawMaterial.costPerUnit,
      status: "active"
    });

    return res.status(201).json({ success: true, message: "Batch created successfully", batch });
  } catch (error) {
    return next(error);
  }
}

export async function markDamaged(req, res, next) {
  try {
    const { id } = req.params;
    const { reason, quantity } = req.body;

    const batch = await Batch.findById(id).populate("rawMaterialId");
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    const qtyToMark = quantity !== undefined && quantity <= batch.remainingQty ? quantity : batch.remainingQty;
    const wasteCost = qtyToMark * batch.costPerUnit;

    const beforeState = { remainingQty: batch.remainingQty, status: batch.status };

    batch.remainingQty = Math.max(0, batch.remainingQty - qtyToMark);
    if (batch.remainingQty === 0) {
      batch.status = "damaged";
    }
    await batch.save();

    // Create waste log entry
    const wasteLog = await WasteLog.create({
      itemType: "raw_material",
      itemId: batch.rawMaterialId._id,
      quantity: qtyToMark,
      reason: reason || "damaged_storage",
      cost: wasteCost,
      date: new Date()
    });

    // Create alert
    const alert = await Alert.create({
      type: "shortage",
      severity: "warning",
      message: `Batch ${batch.batchNo} of ${batch.rawMaterialId.name} marked damaged (${qtyToMark} ${batch.rawMaterialId.unit}). Remaining: ${batch.remainingQty}.`,
      relatedId: batch._id
    });

    // Emit socket alert
    const io = req.app.get("io");
    if (io) {
      io.emit("alert:new", alert);
      io.emit("batch:updated", batch);
    }

    // Audit log
    await AuditLog.create({
      user: req.user?.name || "Staff",
      action: "BATCH_DAMAGED",
      entity: `Batch ${batch.batchNo}`,
      before: beforeState,
      after: { remainingQty: batch.remainingQty, status: batch.status }
    });

    return res.status(200).json({
      success: true,
      message: `Marked ${qtyToMark} units of batch ${batch.batchNo} as damaged`,
      batch,
      wasteLog
    });
  } catch (error) {
    return next(error);
  }
}