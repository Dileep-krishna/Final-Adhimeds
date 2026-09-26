import mongoose from "mongoose";
import Order from "../../model/Order.js";
import MedicalStore from "../../model/MedicalstoreManagementModel.js";
import AppUser from "../model/AppUser.js";

/**
 * ============================================================
 * CREATE NORMAL ORDER
 * ============================================================
 *
 * Normal order = order without prescription
 *
 * POST /api/app/orders/normal
 *
 * Body:
 * {
 *   "customerId": "CUSTOMER_ID",
 *   "shopid": "30",
 *   "items": [...]
 * }
 *
 */
export const createNormalOrder = async (req, res) => {
  try {
    const {
      customerId,
      shopid,
      storeId,
      items,
      total,
    } = req.body;

    // ---------------------------------------
    // VALIDATION - CUSTOMER
    // ---------------------------------------

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customerId",
      });
    }

    // ---------------------------------------
    // VALIDATION - STORE
    // ---------------------------------------

    if (!shopid && !storeId) {
      return res.status(400).json({
        success: false,
        message: "shopid or storeId is required",
      });
    }

    // ---------------------------------------
    // VALIDATION - ITEMS
    // ---------------------------------------

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    // ---------------------------------------
    // CHECK CUSTOMER
    // ---------------------------------------

    const customer = await AppUser.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // ---------------------------------------
    // FIND MEDICAL STORE
    // ---------------------------------------

    let store;

    if (storeId) {
      if (!mongoose.Types.ObjectId.isValid(storeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid storeId",
        });
      }

      store = await MedicalStore.findById(storeId);
    } else {
      store = await MedicalStore.findOne({
        shopid: String(shopid),
      });
    }

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Medical store not found",
      });
    }

    // ---------------------------------------
    // PREPARE ORDER ITEMS
    // ---------------------------------------

    let calculatedTotal = 0;

    const orderItems = items.map((item) => {
      const quantity = Number(item.quantity || 1);
      const rate = Number(item.rate || 0);
      const mrp = Number(item.mrp || 0);

      calculatedTotal += rate * quantity;

      return {
        productName: item.productName || "",

        storeName:
          item.storeName ||
          store.storeName ||
          "",

        mrp,
        rate,
        quantity,

        stock: Number(item.stock || 0),

        qtyPerBox: Number(
          item.qtyPerBox || 0
        ),

        company: item.company || "",

        hsn: item.hsn || "",

        batch: item.batch || "",

        expiry: item.expiry || "",

        pack: item.pack || "",

        scheme: item.scheme || "",

        gst: item.gst || "",

        status: "pending",

        assignedTo: "",

        billUrl: "",
      };
    });

    // ---------------------------------------
    // CREATE NORMAL ORDER
    // ---------------------------------------

    const order = await Order.create({
      // Customer
      customerId: customer._id,

      // Store
      storeId: store._id,

      // Shop
      shopid:
        store.shopid ||
        String(shopid || ""),

      // Normal order
      orderType: "normal",

      // No prescription
      prescriptionId: null,

      // Items
      items: orderItems,

      // Total
      total:
        total !== undefined
          ? Number(total)
          : calculatedTotal,

      // Initial status
      status: "pending",
    });

    // ---------------------------------------
    // RESPONSE
    // ---------------------------------------

    return res.status(201).json({
      success: true,
      message: "Normal order created successfully",
      data: order,
    });

  } catch (error) {
    console.error(
      "Create Normal Order Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create normal order",
      error: error.message,
    });
  }
};


/**
 * ============================================================
 * GET ALL NORMAL ORDERS
 * ============================================================
 *
 * GET /api/app/orders/normal
 *
 * Optional:
 *
 * GET /api/app/orders/normal?shopid=30
 *
 * GET /api/app/orders/normal?storeId=STORE_ID
 *
 */
export const getNormalOrders = async (req, res) => {
  try {
    const {
      shopid,
      storeId,
    } = req.query;

    // ---------------------------------------
    // BUILD QUERY
    // ---------------------------------------

    const query = {
      orderType: "normal",
    };

    // ---------------------------------------
    // FILTER BY SHOP ID
    // ---------------------------------------

    if (shopid) {
      query.shopid = String(shopid);
    }

    // ---------------------------------------
    // FILTER BY STORE ID
    // ---------------------------------------

    if (storeId) {
      if (
        !mongoose.Types.ObjectId.isValid(storeId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid storeId",
        });
      }

      query.storeId = storeId;
    }

    // ---------------------------------------
    // GET ORDERS
    // ---------------------------------------

    const orders = await Order.find(query)
      .populate(
        "customerId",
        "name phone email profileImage"
      )
      .populate(
        "storeId",
        "storeName shopid phone email latitude longitude"
      )
      .sort({
        createdAt: -1,
      });

    // ---------------------------------------
    // RESPONSE
    // ---------------------------------------

    return res.status(200).json({
      success: true,
      message: "Normal orders fetched successfully",

      count: orders.length,

      data: orders,
    });

  } catch (error) {
    console.error(
      "Get Normal Orders Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch normal orders",
      error: error.message,
    });
  }
};


/**
 * ============================================================
 * GET SINGLE NORMAL ORDER
 * ============================================================
 *
 * GET /api/app/orders/normal/:id
 *
 */
export const getNormalOrderById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ---------------------------------------
    // VALIDATE ORDER ID
    // ---------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ---------------------------------------
    // FIND ORDER
    // ---------------------------------------

    const order = await Order.findOne({
      _id: id,
      orderType: "normal",
    })
      .populate(
        "customerId",
        "name phone email profileImage"
      )
      .populate(
        "storeId",
        "storeName shopid phone email latitude longitude"
      );

    // ---------------------------------------
    // ORDER NOT FOUND
    // ---------------------------------------

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Normal order not found",
      });
    }

    // ---------------------------------------
    // RESPONSE
    // ---------------------------------------

    return res.status(200).json({
      success: true,
      message: "Normal order fetched successfully",
      data: order,
    });

  } catch (error) {
    console.error(
      "Get Normal Order Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch normal order",
      error: error.message,
    });
  }
};