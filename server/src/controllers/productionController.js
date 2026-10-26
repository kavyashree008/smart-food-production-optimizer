import { ProductionPlan } from "../models/ProductionPlan.js";
import { Product } from "../models/Product.js";
import { AuditLog } from "../models/AuditLog.js";

export async function getProductionSchedule(req, res, next) {
  try {
    const plans = await ProductionPlan.find({
      status: { $in: ["accepted", "modified", "in_progress", "completed", "delayed"] }
    })
      .populate("productId", "name sku unit category productionRatePerHour currentStock safetyStock")
      .populate("createdBy", "name")
      .sort({ date: 1, createdAt: -1 });

    const today = new Date();

    const jobs = plans.map((p) => {
      const producedQty = p.inputsSnapshot?.producedQuantity || 0;
      const progressPercent = p.quantity > 0 ? Math.min(100, Math.round((producedQty / p.quantity) * 100)) : 0;
      const isDelayed = p.status !== "completed" && new Date(p.date) < today;

      return {
        _id: p._id,
        productId: p.productId,
        quantity: p.quantity,
        producedQuantity: producedQty,
        progressPercent: p.status === "completed" ? 100 : progressPercent,
        date: p.date,
        status: isDelayed && p.status === "in_progress" ? "delayed" : p.status,
        riskLevel: p.riskLevel,
        riskScore: p.riskScore,
        version: p.version || 1,
        inputsSnapshot: p.inputsSnapshot,
        aiExplanation: p.aiExplanation || p.reasoning,
        changeReason: p.changeReason,
        estimatedHours: p.productId?.productionRatePerHour
          ? Number((p.quantity / p.productId.productionRatePerHour).toFixed(1))
          : 2.0
      };
    });

    return res.status(200).json({ success: true, count: jobs.length, jobs, schedule: jobs });
  } catch (error) {
    return next(error);
  }
}

export async function scheduleRecommendedJobs(req, res, next) {
  try {
    // Find latest recommended plans and accept them into schedule
    const recommended = await ProductionPlan.find({ status: "recommended" })
      .populate("productId")
      .sort({ createdAt: -1 });

    if (recommended.length === 0) {
      return res.status(200).json({ success: true, message: "No pending recommendations to schedule", scheduledCount: 0 });
    }

    const scheduledIds = [];
    for (const plan of recommended) {
      plan.status = "accepted";
      await plan.save();
      scheduledIds.push(plan._id);
    }

    const io = req.app.get("io");
    if (io) io.emit("production:schedule_updated", { count: scheduledIds.length });

    await AuditLog.create({
      user: req.user?.name || "Manager",
      action: "AUTO_SCHEDULE_RECOMMENDED",
      entity: `${scheduledIds.length} recommended plans accepted into schedule`
    });

    return res.status(200).json({
      success: true,
      message: `Successfully scheduled ${scheduledIds.length} recommended production jobs`,
      scheduledCount: scheduledIds.length
    });
  } catch (error) {
    return next(error);
  }
}

export async function startJob(req, res, next) {
  try {
    const plan = await ProductionPlan.findById(req.params.id).populate("productId");
    if (!plan) return res.status(404).json({ success: false, message: "Job not found" });

    plan.status = "in_progress";
    await plan.save();

    const io = req.app.get("io");
    if (io) io.emit("production:status", { id: plan._id, status: "in_progress" });

    await AuditLog.create({
      user: req.user?.name || "Staff",
      action: "PRODUCTION_STARTED",
      entity: `Job ${plan._id} (${plan.productId?.name})`
    });

    return res.status(200).json({ success: true, message: "Production started", plan });
  } catch (error) {
    return next(error);
  }
}

export async function updateProgress(req, res, next) {
  try {
    const rawQty = req.body.producedQuantity ?? req.body.producedQty;
    const producedQuantity = Number(rawQty);
    const plan = await ProductionPlan.findById(req.params.id).populate("productId");
    if (!plan) return res.status(404).json({ success: false, message: "Job not found" });

    const currentSnapshot = plan.inputsSnapshot || {};
    currentSnapshot.producedQuantity = producedQuantity;
    plan.inputsSnapshot = currentSnapshot;
    plan.markModified("inputsSnapshot");

    if (producedQuantity >= plan.quantity) {
      plan.status = "completed";
      // Update finished stock
      if (plan.productId) {
        await Product.findByIdAndUpdate(plan.productId._id, {
          $inc: { currentStock: plan.quantity }
        });
      }
    } else {
      plan.status = "in_progress";
    }

    await plan.save();

    const io = req.app.get("io");
    if (io) io.emit("production:progress", { id: plan._id, producedQuantity, status: plan.status });

    return res.status(200).json({ success: true, message: "Progress updated", plan });
  } catch (error) {
    return next(error);
  }
}

export async function completeJob(req, res, next) {
  try {
    const plan = await ProductionPlan.findById(req.params.id).populate("productId");
    if (!plan) return res.status(404).json({ success: false, message: "Job not found" });

    plan.status = "completed";
    const currentSnapshot = plan.inputsSnapshot || {};
    currentSnapshot.producedQuantity = plan.quantity;
    plan.inputsSnapshot = currentSnapshot;
    plan.markModified("inputsSnapshot");
    await plan.save();

    if (plan.productId) {
      await Product.findByIdAndUpdate(plan.productId._id, {
        $inc: { currentStock: plan.quantity }
      });
    }

    const io = req.app.get("io");
    if (io) io.emit("production:status", { id: plan._id, status: "completed" });

    await AuditLog.create({
      user: req.user?.name || "Staff",
      action: "PRODUCTION_COMPLETED",
      entity: `Job ${plan._id} (${plan.productId?.name})`,
      after: { addedStock: plan.quantity }
    });

    return res.status(200).json({ success: true, message: "Production job completed", plan });
  } catch (error) {
    return next(error);
  }
}