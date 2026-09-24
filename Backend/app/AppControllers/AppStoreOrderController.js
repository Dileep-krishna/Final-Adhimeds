import mongoose from "mongoose";
import Order from "../../model/Order.js";
import MedicalStore from "../../model/MedicalstoreManagementModel.js";

/*
|--------------------------------------------------------------------------
| HELPER - FIND STORE BY SHOP ID
|--------------------------------------------------------------------------
*/
const getStoreByShopId = async (shopid) => {
  if (!shopid) {
    return null;
  }

  return await MedicalStore.findOne({
    shopid: String(shopid),
  });
};


/*
|--------------------------------------------------------------------------
| GET NEW ORDERS
|--------------------------------------------------------------------------
| Website-created orders waiting for store action.
|
| pending / confirmed
|
| GET /api/app/store/orders/new?shopid=30
|--------------------------------------------------------------------------
*/
export const getNewOrders = async (req, res) => {
  try {
    const { shopid } = req.query;

    if (!shopid) {
      return res.status(400).json({
        success: false,
        message: "shopid is required",
      });
    }

    const store = await getStoreByShopId(shopid);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    const orders = await Order.find({
      storeId: store._id,
      status: "pending",
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "New orders fetched successfully",
      shopid: String(shopid),
      storeId: store._id,
      storeName: store.storeName,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get New Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch new orders",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET ONGOING ORDERS
|--------------------------------------------------------------------------
| Store accepted/ongoing orders.
|
| processing / assigned
|
| GET /api/app/store/orders/ongoing?shopid=30
|--------------------------------------------------------------------------
*/
export const getOngoingOrders = async (req, res) => {
  try {
    const { shopid } = req.query;

    console.log("📥 MOBILE - GET ONGOING ORDERS");
    console.log("🏪 Shop ID:", shopid);

    if (!shopid) {
      return res.status(400).json({
        success: false,
        message: "shopid is required",
      });
    }

    const store = await getStoreByShopId(shopid);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: `Store not found for shopid ${shopid}`,
      });
    }

    const orders = await Order.find({
      storeId: store._id,
      status: {
        $in: ["confirmed","processing", "assigned"],
      },
    })
      .sort({ updatedAt: -1 })
      .lean();

    console.log(`✅ Ongoing orders found: ${orders.length}`);

    return res.status(200).json({
      success: true,
      message: "Ongoing orders fetched successfully",
      count: orders.length,
      shopid: String(shopid),
      storeId: store._id,
      storeName: store.storeName,
      data: orders,
    });
  } catch (error) {
    console.error("❌ Get ongoing orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch ongoing orders",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET COMPLETED / DELIVERED ORDERS
|--------------------------------------------------------------------------
| Database status = completed
|
| GET /api/app/store/orders/completed?shopid=30
|--------------------------------------------------------------------------
*/
export const getCompletedOrders = async (req, res) => {
  try {
    const { shopid } = req.query;

    console.log("📥 MOBILE - GET COMPLETED ORDERS");
    console.log("🏪 Shop ID:", shopid);

    if (!shopid) {
      return res.status(400).json({
        success: false,
        message: "shopid is required",
      });
    }

    const store = await getStoreByShopId(shopid);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: `Store not found for shopid ${shopid}`,
      });
    }

    const orders = await Order.find({
      storeId: store._id,
      status: "completed",
    })
      .sort({ updatedAt: -1 })
      .lean();

    console.log(`✅ Completed orders found: ${orders.length}`);

    return res.status(200).json({
      success: true,
      message: "Completed orders fetched successfully",
      count: orders.length,
      shopid: String(shopid),
      storeId: store._id,
      storeName: store.storeName,
      data: orders,
    });
  } catch (error) {
    console.error("❌ Get completed orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch completed orders",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET CANCELLED / REJECTED ORDERS
|--------------------------------------------------------------------------
|
| GET /api/app/store/orders/cancelled?shopid=30
|--------------------------------------------------------------------------
*/
export const getCancelledOrders = async (req, res) => {
  try {
    const { shopid } = req.query;

    console.log("📥 MOBILE - GET CANCELLED ORDERS");
    console.log("🏪 Shop ID:", shopid);

    if (!shopid) {
      return res.status(400).json({
        success: false,
        message: "shopid is required",
      });
    }

    const store = await getStoreByShopId(shopid);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: `Store not found for shopid ${shopid}`,
      });
    }

    const orders = await Order.find({
      storeId: store._id,
      status: "cancelled",
    })
      .sort({ updatedAt: -1 })
      .lean();

    console.log(`✅ Cancelled orders found: ${orders.length}`);

    return res.status(200).json({
      success: true,
      message: "Cancelled orders fetched successfully",
      count: orders.length,
      shopid: String(shopid),
      storeId: store._id,
      storeName: store.storeName,
      data: orders,
    });
  } catch (error) {
    console.error("❌ Get cancelled orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch cancelled orders",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET SINGLE ORDER
|--------------------------------------------------------------------------
|
| GET /api/app/store/orders/:orderId
|--------------------------------------------------------------------------
*/
export const getStoreOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log("📥 MOBILE - GET ORDER DETAILS");
    console.log("📦 Order ID:", orderId);

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order details fetched successfully",
      data: order,
    });
  } catch (error) {
    console.error("❌ Get order details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| ACCEPT ORDER
|--------------------------------------------------------------------------
| pending / confirmed → processing
|
| POST /api/app/store/orders/:orderId/accept
|--------------------------------------------------------------------------
*/
export const acceptStoreOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log("📥 MOBILE - ACCEPT ORDER");
    console.log("📦 Order ID:", orderId);

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("📊 Current order status:", order.status);
    console.log("🏪 Store ID:", order.storeId);
    console.log("🏪 Shop ID:", order.shopid);

    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be accepted from ${order.status} status`,
      });
    }

    order.status = "processing";

    order.items.forEach((item) => {
      if (["pending", "confirmed"].includes(item.status)) {
        item.status = "processing";
      }
    });

    await order.save();

    console.log(`✅ Order ${orderId} ACCEPTED`);
    console.log(`➡️ Main order status: ${order.status}`);

    const io = req.app.get("io");

    if (io) {
      io.to(`store-${order.storeId}`).emit("order_status_updated", {
        orderId: order._id,
        storeId: order.storeId,
        shopid: order.shopid,
        status: "processing",
        displayStatus: "ongoing",
        order,
      });

      console.log(
        `📡 Socket event sent to store-${order.storeId}`
      );
    }

    return res.status(200).json({
      success: true,
      message: "Order accepted successfully",
      data: {
        orderId: order._id,
        storeId: order.storeId,
        shopid: order.shopid,
        status: order.status,
        displayStatus: "ongoing",
        order,
      },
    });

  } catch (error) {
    console.error("❌ Accept order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept order",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| REJECT ORDER
|--------------------------------------------------------------------------
| pending / confirmed → cancelled
|
| POST /api/app/store/orders/:orderId/reject
|--------------------------------------------------------------------------
*/
export const rejectStoreOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log("📥 MOBILE - REJECT ORDER");
    console.log("📦 Order ID:", orderId);

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be rejected from ${order.status} status`,
      });
    }

    order.status = "cancelled";

    order.items.forEach((item) => {
      if (["pending", "confirmed"].includes(item.status)) {
        item.status = "cancelled";
      }
    });

    await order.save();

    console.log(
      `❌ Order ${orderId} REJECTED → cancelled`
    );

    const io = req.app.get("io");

    if (io) {
      io.to(`store-${order.storeId}`).emit("order_status_updated", {
        orderId: order._id,
        storeId: order.storeId,
        shopid: order.shopid,
        status: "cancelled",
        displayStatus: "cancelled",
        order,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order rejected successfully",
      data: {
        orderId: order._id,
        storeId: order.storeId,
        shopid: order.shopid,
        status: order.status,
        displayStatus: "cancelled",
        order,
      },
    });

  } catch (error) {
    console.error("❌ Reject order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject order",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| MARK ORDER ONGOING
|--------------------------------------------------------------------------
| pending / confirmed → processing
|
| POST /api/app/store/orders/:orderId/ongoing
|--------------------------------------------------------------------------
*/
export const markOrderOngoing = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log("📥 MOBILE - MARK ORDER ONGOING");
    console.log("📦 Order ID:", orderId);

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be moved to ongoing from ${order.status}`,
      });
    }

    order.status = "processing";

    order.items.forEach((item) => {
      if (["pending", "confirmed"].includes(item.status)) {
        item.status = "processing";
      }
    });

    await order.save();

    console.log(
      `🔄 Order ${orderId} moved to ONGOING`
    );

    const io = req.app.get("io");

    if (io) {
      io.to(`store-${order.storeId}`).emit("order_status_updated", {
        orderId: order._id,
        storeId: order.storeId,
        shopid: order.shopid,
        status: "processing",
        displayStatus: "ongoing",
        order,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order moved to ongoing successfully",
      data: {
        orderId: order._id,
        storeId: order.storeId,
        shopid: order.shopid,
        status: order.status,
        displayStatus: "ongoing",
        order,
      },
    });

  } catch (error) {
    console.error("❌ Mark ongoing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| MARK ORDER DELIVERED
|--------------------------------------------------------------------------
| processing / assigned → completed
|
| POST /api/app/store/orders/:orderId/delivered
|--------------------------------------------------------------------------
*/
export const markOrderDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log("📥 MOBILE - MARK ORDER DELIVERED");
    console.log("📦 Order ID:", orderId);

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!["processing", "assigned"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be delivered from ${order.status} status`,
      });
    }

    order.status = "completed";

    order.items.forEach((item) => {
      if (["processing", "assigned"].includes(item.status)) {
        item.status = "completed";
      }
    });

    await order.save();

    console.log(
      `🚚 Order ${orderId} DELIVERED → completed`
    );

    const io = req.app.get("io");

    if (io) {
      io.to(`store-${order.storeId}`).emit("order_status_updated", {
        orderId: order._id,
        storeId: order.storeId,
        shopid: order.shopid,
        status: "completed",
        displayStatus: "delivered",
        order,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order delivered successfully",
      data: {
        orderId: order._id,
        storeId: order.storeId,
        shopid: order.shopid,
        status: order.status,
        displayStatus: "delivered",
        order,
      },
    });

  } catch (error) {
    console.error("❌ Mark delivered error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark order as delivered",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET ACCEPTED + REJECTED ORDERS
|--------------------------------------------------------------------------
| IMPORTANT:
|
| cancelled = REJECTED
|
| ANY OTHER STATUS = ACCEPTED
|
| pending
| confirmed
| processing
| assigned
| completed
| all go into acceptedOrders
|
| GET /api/app/store/orders/history?shopid=30
|--------------------------------------------------------------------------
*/
export const getStoreOrderHistory = async (req, res) => {
  try {
    const { shopid } = req.query;

    console.log("📥 MOBILE - GET ACCEPTED / REJECTED ORDERS");
    console.log("🏪 Shop ID:", shopid);

    if (!shopid) {
      return res.status(400).json({
        success: false,
        message: "shopid is required",
      });
    }

    const store = await getStoreByShopId(shopid);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: `Store not found for shopid ${shopid}`,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL ORDERS FOR THIS STORE
    |--------------------------------------------------------------------------
    */

    const orders = await Order.find({
      storeId: store._id,
    })
      .sort({ updatedAt: -1 })
      .lean();

    /*
    |--------------------------------------------------------------------------
    | CLASSIFY ORDERS
    |--------------------------------------------------------------------------
    |
    | cancelled → rejectedOrders
    |
    | EVERYTHING ELSE → acceptedOrders
    |
    */

    const acceptedOrders = [];
    const rejectedOrders = [];

    orders.forEach((order) => {
      if (order.status === "cancelled") {
        rejectedOrders.push({
          ...order,
          orderStatus: "rejected",
        });
      } else {
        acceptedOrders.push({
          ...order,
          orderStatus: "accepted",
        });
      }
    });

    console.log(
      `✅ Accepted orders: ${acceptedOrders.length}`
    );

    console.log(
      `❌ Rejected orders: ${rejectedOrders.length}`
    );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,
      message: "Accepted and rejected orders fetched successfully",

      shopid: String(shopid),

      storeId: store._id,

      storeName: store.storeName,

      acceptedCount: acceptedOrders.length,

      rejectedCount: rejectedOrders.length,

      acceptedOrders,

      rejectedOrders,
    });

  } catch (error) {
    console.error(
      "❌ Get accepted/rejected orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch accepted and rejected orders",
      error: error.message,
    });
  }
};