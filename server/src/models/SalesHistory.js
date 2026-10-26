import mongoose from "mongoose";

const salesHistorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    quantitySold: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

// Compound index for querying a product's sales series chronologically
salesHistorySchema.index({ productId: 1, date: 1 });

export const SalesHistory = mongoose.model("SalesHistory", salesHistorySchema);