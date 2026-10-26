import { RawMaterial } from "../models/RawMaterial.js";
import { Batch } from "../models/Batch.js";

export async function getRawMaterials(req, res, next) {
  try {
    const materials = await RawMaterial.find().sort({ name: 1 });
    
    // Enrich with aggregated active stock across batches
    const enriched = await Promise.all(
      materials.map(async (m) => {
        const batches = await Batch.find({
          rawMaterialId: m._id,
          status: "active",
          expiryDate: { $gt: new Date() }
        });
        const currentStock = batches.reduce((sum, b) => sum + b.remainingQty, 0);
        return {
          ...m.toObject(),
          currentStock,
          activeBatchesCount: batches.length
        };
      })
    );

    return res.status(200).json({ success: true, count: enriched.length, rawMaterials: enriched });
  } catch (error) {
    return next(error);
  }
}

export async function getRawMaterialById(req, res, next) {
  try {
    const rawMaterial = await RawMaterial.findById(req.params.id);
    if (!rawMaterial) {
      return res.status(404).json({ success: false, message: "Raw material not found" });
    }
    return res.status(200).json({ success: true, rawMaterial });
  } catch (error) {
    return next(error);
  }
}

export async function createRawMaterial(req, res, next) {
  try {
    const rawMaterial = await RawMaterial.create(req.body);
    return res.status(201).json({ success: true, message: "Raw material created successfully", rawMaterial });
  } catch (error) {
    return next(error);
  }
}

export async function updateRawMaterial(req, res, next) {
  try {
    const rawMaterial = await RawMaterial.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!rawMaterial) {
      return res.status(404).json({ success: false, message: "Raw material not found" });
    }
    return res.status(200).json({ success: true, message: "Raw material updated successfully", rawMaterial });
  } catch (error) {
    return next(error);
  }
}

export async function deleteRawMaterial(req, res, next) {
  try {
    const rawMaterial = await RawMaterial.findByIdAndDelete(req.params.id);
    if (!rawMaterial) {
      return res.status(404).json({ success: false, message: "Raw material not found" });
    }
    return res.status(200).json({ success: true, message: "Raw material deleted successfully" });
  } catch (error) {
    return next(error);
  }
}