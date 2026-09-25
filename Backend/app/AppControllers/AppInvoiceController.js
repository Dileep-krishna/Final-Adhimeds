import mongoose from "mongoose";
import Invoice from "../model/Invoice.js";
import Order from "../../model/Order.js";


// =====================================================
// GET INVOICE FOR ORDER
// =====================================================

export const getOrderInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log("📥 Get Order Invoice");
    console.log("📦 Order ID:", orderId);

    // -------------------------------------------------
    // Validate order ID
    // -------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // -------------------------------------------------
    // Find order
    // -------------------------------------------------

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // -------------------------------------------------
    // Find existing invoice record
    // -------------------------------------------------

    let invoice = await Invoice.findOne({
      orderId: order._id,
    }).lean();

    // -------------------------------------------------
    // If invoice record doesn't exist,
    // create it from existing store billUrl
    // -------------------------------------------------

    if (!invoice) {
      const billItem = order.items?.find(
        (item) => item.billUrl && item.billUrl.trim() !== ""
      );

      if (!billItem) {
        return res.status(404).json({
          success: false,
          message: "Invoice not available for this order",
          orderId: order._id,
        });
      }

      const invoiceUrl = billItem.billUrl;

      const invoiceFileName = invoiceUrl
        ? invoiceUrl.split("/").pop()
        : "";

      const newInvoice = await Invoice.create({
        orderId: order._id,
        storeId: order.storeId,
        shopid: order.shopid || "",
        invoiceUrl,
        invoiceFileName,
        status: "available",
      });

      invoice = newInvoice.toObject();
    }

    // -------------------------------------------------
    // Return invoice
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Order invoice fetched successfully",

      data: {
        orderId: order._id,
        storeId: order.storeId,
        shopid: order.shopid,

        invoiceId: invoice._id,

        invoiceNumber: invoice.invoiceNumber,

        invoiceUrl: invoice.invoiceUrl,

        invoiceFileName: invoice.invoiceFileName,

        status: invoice.status,

        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      },
    });

  } catch (error) {
    console.error("❌ Get Order Invoice Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order invoice",
      error: error.message,
    });
  }
};