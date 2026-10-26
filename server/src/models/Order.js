import mongoose from "mongoose";
import { ORDER_PRIORITY, ORDER_STATUS } from "../config/constants.js";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    qty: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNo: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      uppercase: true,
      trim: true
    },
    customer: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(v) => v.length > 0, "Order must have at least one product item"]
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"]
    },
    priority: {
      type: String,
      enum: Object.values(ORDER_PRIORITY),
      default: ORDER_PRIORITY.NORMAL
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.CONFIRMED
    }
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);