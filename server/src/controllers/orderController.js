import { Order } from "../models/Order.js";
import { AuditLog } from "../models/AuditLog.js";

export async function getOrders(req, res, next) {
  try {
    const { status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const orders = await Order.find(filter)
      .populate("items.productId", "name sku category sellingPrice shelfLifeDays")
      .sort({ dueDate: 1 });

    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    return next(error);
  }
}

export async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.productId", "name sku category sellingPrice");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    return next(error);
  }
}

export async function createOrder(req, res, next) {
  try {
    const order = await Order.create(req.body);
    await order.populate("items.productId", "name sku");

    // Audit log
    await AuditLog.create({
      user: req.user?.name || "Manager",
      action: "ORDER_CREATED",
      entity: `Order ${order.orderNo}`,
      after: { orderNo: order.orderNo, customer: order.customer, dueDate: order.dueDate }
    });

    // Real-time notifications
    const io = req.app.get("io");
    if (io) {
      io.emit("order:new", order);
      io.emit("plan:needs_replan", {
        reason: `New order ${order.orderNo} (${order.customer}) created`,
        orderNo: order.orderNo
      });
    }

    return res.status(201).json({
      success: true,
      message: "Order created successfully. Planning engine trigger notified.",
      order
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    await AuditLog.create({
      user: req.user?.name || "Staff",
      action: "ORDER_STATUS_CHANGED",
      entity: `Order ${order.orderNo}`,
      before: { status: previousStatus },
      after: { status: order.status }
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("order:updated", order);
    }

    return res.status(200).json({ success: true, message: "Order status updated", order });
  } catch (error) {
    return next(error);
  }
}

export async function deleteOrder(req, res, next) {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.status(200).json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    return next(error);
  }
}