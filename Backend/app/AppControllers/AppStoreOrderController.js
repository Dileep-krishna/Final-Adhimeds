import mongoose from "mongoose";
import Order from "../../model/Order.js";
import MedicalStore from "../../model/MedicalstoreManagementModel.js";


// ──────────────────────────────────────────────
// GET STORE ORDERS
// ──────────────────────────────────────────────
export const getStoreOrders = async (req, res) => {
  try {
    const store = req.store;

    if (!store) {
      return res.status(401).json({
        success: false,
        message: "Store authentication required",
      });
    }

    const orders = await Order.find({
      storeId: store._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Store orders fetched successfully",
      total: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get store orders error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch store orders",
    });
  }
};


// ──────────────────────────────────────────────
// GET NEW ORDERS
// pending + confirmed
// ──────────────────────────────────────────────
export const getNewOrders = async (req, res) => {
  try {
    const store = req.store;

    if (!store) {
      return res.status(401).json({
        success: false,
        message: "Store authentication required",
      });
    }

    const orders = await Order.find({
      storeId: store._id,
      status: {
        $in: ["pending", "confirmed"],
      },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "New orders fetched successfully",
      total: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get new orders error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch new orders",
    });
  }
};


// ──────────────────────────────────────────────
// GET ONGOING ORDERS
// processing + assigned
// ──────────────────────────────────────────────
export const getOngoingOrders = async (req, res) => {
  try {
    const store = req.store;

    if (!store) {
      return res.status(401).json({
        success: false,
        message: "Store authentication required",
      });
    }

    const orders = await Order.find({
      storeId: store._id,
      status: {
        $in: ["processing", "assigned"],
      },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Ongoing orders fetched successfully",
      total: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get ongoing orders error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch ongoing orders",
    });
  }
};


// ──────────────────────────────────────────────
// GET COMPLETED ORDERS
// ──────────────────────────────────────────────
export const getCompletedOrders = async (req, res) => {
  try {
    const store = req.store;

    if (!store) {
      return res.status(401).json({
        success: false,
        message: "Store authentication required",
      });
    }

    const orders = await Order.find({
      storeId: store._id,
      status: "completed",
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Completed orders fetched successfully",
      total: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get completed orders error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch completed orders",
    });
  }
};


// ──────────────────────────────────────────────
// GET CANCELLED ORDERS
// ──────────────────────────────────────────────
export const getCancelledOrders = async (req, res) => {
  try {
    const store = req.store;

    if (!store) {
      return res.status(401).json({
        success: false,
        message: "Store authentication required",
      });
    }

    const orders = await Order.find({
      storeId: store._id,
      status: "cancelled",
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Cancelled orders fetched successfully",
      total: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get cancelled orders error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch cancelled orders",
    });
  }
};


// ──────────────────────────────────────────────
// GET ORDER DETAIL
// ──────────────────────────────────────────────
export const getStoreOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const store = req.store;

    if (!store) {
      return res.status(401).json({
        success: false,
        message: "Store authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      storeId: store._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: order,
    });
  } catch (error) {
    console.error("Get order detail error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order",
    });
  }
};


// ──────────────────────────────────────────────
// UPDATE ORDER STATUS
// ──────────────────────────────────────────────
export const updateStoreOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const store = req.store;

    if (!store) {
      return res.status(401).json({
        success: false,
        message: "Store authentication required",
      });
    }

    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "completed",
      "cancelled",
      "assigned",
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      storeId: store._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = status;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};


// ──────────────────────────────────────────────
// UPDATE ORDER ITEM STATUS
// ──────────────────────────────────────────────
export const updateStoreOrderItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status, assignedTo, billUrl } = req.body;

    const store = req.store;

    if (!store) {
      return res.status(401).json({
        success: false,
        message: "Store authentication required",
      });
    }

    const validStatuses = [
      "pending",
      "processing",
      "completed",
      "cancelled",
      "assigned",
      "confirmed",
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item status",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      storeId: store._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const item = order.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Order item not found",
      });
    }

    // Bill required before processing
    if (status === "processing" && !billUrl && !item.billUrl) {
      return res.status(400).json({
        success: false,
        message: "Bill must be uploaded before accepting the order",
      });
    }

    item.status = status;

    if (assignedTo !== undefined) {
      item.assignedTo = assignedTo;
    }

    if (billUrl !== undefined) {
      item.billUrl = billUrl;
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order item status updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Update order item status error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order item",
    });
  }
};
const getMedicalStoreId = async (req) => {
  if (!req.store) {
    return null;
  }

  if (req.storeSource === "MedicalStore") {
    return req.store._id;
  }

  // If login came from Store collection, find its matching MedicalStore
  const medicalStore = await MedicalStore.findOne({
    $or: [
      { emailAddress: req.store.emailAddress },
      { shopid: req.store.shopid },
      { contactNumber: req.store.contactNumber },
    ],
  });

  return medicalStore?._id || null;
};