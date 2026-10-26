import { Alert } from "../models/Alert.js";

export async function getAlerts(req, res, next) {
  try {
    const { severity, type, isRead } = req.query;
    const filter = {};
    if (severity) filter.severity = severity;
    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === "true";

    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(100);
    const unreadCount = await Alert.countDocuments({ isRead: false });

    return res.status(200).json({ success: true, count: alerts.length, unreadCount, alerts });
  } catch (error) {
    return next(error);
  }
}

export async function markAlertRead(req, res, next) {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!alert) return res.status(404).json({ success: false, message: "Alert not found" });
    return res.status(200).json({ success: true, alert });
  } catch (error) {
    return next(error);
  }
}

export async function markAllAlertsRead(req, res, next) {
  try {
    await Alert.updateMany({ isRead: false }, { isRead: true });
    return res.status(200).json({ success: true, message: "All alerts marked as read" });
  } catch (error) {
    return next(error);
  }
}