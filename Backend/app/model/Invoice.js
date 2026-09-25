import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },

    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalStore",
      required: true,
      index: true,
    },

    shopid: {
      type: String,
      default: "",
      index: true,
    },

    invoiceNumber: {
      type: String,
      default: "",
      trim: true,
    },

    invoiceUrl: {
      type: String,
      default: "",
    },

    invoiceFileName: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["available", "unavailable"],
      default: "unavailable",
    },
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;