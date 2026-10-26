import { Router } from "express";
import { z } from "zod";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
} from "../controllers/orderController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { validate } from "../middleware/validate.js";
import { ORDER_PRIORITY, ORDER_STATUS } from "../config/constants.js";

const router = Router();

const orderItemSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().positive()
});

const orderSchema = z.object({
  orderNo: z.string().min(2),
  customer: z.string().min(2),
  items: z.array(orderItemSchema).min(1),
  dueDate: z.string().datetime().or(z.date()),
  priority: z.enum(Object.values(ORDER_PRIORITY)).default("normal"),
  status: z.enum(Object.values(ORDER_STATUS)).default("confirmed")
});

const statusUpdateSchema = z.object({
  status: z.enum(Object.values(ORDER_STATUS))
});

router.use(authenticate);

router.get("/", getOrders);
router.get("/:id", getOrderById);
router.post("/", requireRole(["admin", "manager"]), validate(orderSchema), createOrder);
router.patch("/:id/status", requireRole(["admin", "manager", "staff"]), validate(statusUpdateSchema), updateOrderStatus);
router.delete("/:id", requireRole(["admin"]), deleteOrder);

export default router;