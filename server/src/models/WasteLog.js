import mongoose from "mongoose";

const wasteLogSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      required: true,
      enum: ["raw_material", "product"]
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "itemTypeRef"
    },
    itemTypeRef: {
      type: String,
      required: true,
      enum: ["RawMaterial", "Product"],
      default: function() {
        return this.itemType === "raw_material" ? "RawMaterial" : "Product";
      }
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01
    },
    reason: {
      type: String,
      required: true,
      enum: ["expired", "damaged_storage", "process_defect", "quality_fail", "contamination", "spillage"],
      default: "expired"
    },
    cost: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  { timestamps: true }
);

export const WasteLog = mongoose.model("WasteLog", wasteLogSchema);