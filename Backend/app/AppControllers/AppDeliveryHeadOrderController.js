import Order from "../../model/Order.js";
import MedicalStore from "../../model/MedicalstoreManagementModel.js";


// =====================================================
// GET STORE BY SHOP ID
// =====================================================

const getStoreByShopId = async (shopid) => {
  if (!shopid) {
    return null;
  }

  return await MedicalStore.findOne({
    shopid: String(shopid),
  });
};


// =====================================================
// DELIVERY HEAD - NEW ORDERS
// Only pending orders
// =====================================================

export const getDeliveryHeadNewOrders = async (req, res) => {
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
      status: "confirmed",
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Delivery Head new orders fetched successfully",
      shopid: String(shopid),
      storeId: store._id,
      storeName: store.storeName,
      count: orders.length,
      orders,
    });

  } catch (error) {
    console.error("Delivery Head New Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch new orders",
      error: error.message,
    });
  }
};


// =====================================================
// DELIVERY HEAD - ONGOING ORDERS
// Processing = accepted + ongoing
// =====================================================

export const getDeliveryHeadOngoingOrders = async (req, res) => {
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
      status: {
        $in: ["processing", "assigned"],
      },
    })
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Delivery Head ongoing orders fetched successfully",
      shopid: String(shopid),
      storeId: store._id,
      storeName: store.storeName,
      count: orders.length,
      orders,
    });

  } catch (error) {
    console.error("Delivery Head Ongoing Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch ongoing orders",
      error: error.message,
    });
  }
};


// =====================================================
// DELIVERY HEAD - REJECTED ORDERS
// Cancelled = rejected
// =====================================================

export const getDeliveryHeadRejectedOrders = async (req, res) => {
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
      status: "cancelled",
    })
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Delivery Head rejected orders fetched successfully",
      shopid: String(shopid),
      storeId: store._id,
      storeName: store.storeName,
      count: orders.length,
      orders,
    });

  } catch (error) {
    console.error("Delivery Head Rejected Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch rejected orders",
      error: error.message,
    });
  }
};