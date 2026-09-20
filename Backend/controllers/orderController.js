import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Order from '../model/Order.js';
import MedicalStore from '../model/MedicalstoreManagementModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// ──────────────────────────────────────────────
// CREATE ORDER
// ──────────────────────────────────────────────
export const createOrder = async (req, res) => {
  console.log("📨 Create order request received");
  console.log("   Body:", req.body);
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    console.log("❌ Missing cart items");
    return res.status(400).json({ success: false, message: 'Cart items are required' });
  }

  try {
    const storeName = items[0]?.storeName;
    if (!storeName) {
      console.log("❌ No storeName found in cart items");
      return res.status(400).json({ success: false, message: 'Store name is required' });
    }

    const store = await MedicalStore.findOne({ storeName: storeName });
    if (!store) {
      console.log(`❌ Store not found for name: ${storeName}`);
      return res.status(400).json({ success: false, message: `Store "${storeName}" not found` });
    }

    console.log(`✅ Found store: ${store.storeName} (ID: ${store._id}, shopid: ${store.shopid})`);

    const total = items.reduce(
      (sum, item) => sum + (item.mrp || 0) * item.quantity,
      0
    );

    const order = new Order({
      storeId: store._id,
      shopid: store.shopid || '',
      items,
      total,
      status: 'pending',
    });

    await order.save();
    console.log("✅ Order created with ID:", order._id);

    const io = req.app.get('io');
    if (io) {
      io.to(`store-${store._id}`).emit('new_order', { orderId: order._id, order });
      console.log(`✅ Event emitted to room: store-${store._id}`);
    } else {
      console.warn("⚠️ io not found – skipping emit");
    }

    res.status(201).json({
      success: true,
      data: { orderId: order._id, order },
      message: 'Order placed successfully!',
    });
  } catch (error) {
    console.error("🔥 Order creation error:", error);
    res.status(500).json({ success: false, message: error.message || 'Failed to place order' });
  }
};

// ──────────────────────────────────────────────
// GET ALL ORDERS (with storeId filter)
// ──────────────────────────────────────────────
export const getAllOrders = async (req, res) => {
  console.log(`📨 Fetching orders with storeId filter: ${req.query.storeId || 'none'}`);
  try {
    const { storeId } = req.query;
    let filter = {};

    if (storeId) {
      if (mongoose.Types.ObjectId.isValid(storeId)) {
        filter.storeId = storeId;
        console.log(`🔍 Filtering by ObjectId: ${storeId}`);
      } else {
        console.log(`🔍 Treating "${storeId}" as shopid – looking up store...`);
        const store = await MedicalStore.findOne({ shopid: storeId });
        if (store) {
          filter.storeId = store._id;
          console.log(`✅ Found store with shopid ${storeId} → ObjectId ${store._id}`);
        } else {
          console.log(`❌ No store found for shopid: ${storeId}`);
          return res.json({ success: true, data: [] });
        }
      }
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    console.log(`✅ Found ${orders.length} orders`);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("🔥 Error fetching orders:", error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch orders' });
  }
};

// ──────────────────────────────────────────────
// GET ORDER BY ID
// ──────────────────────────────────────────────
export const getOrderById = async (req, res) => {
  const { id } = req.params;
  console.log(`📨 Fetching order with ID: ${id}`);
  try {
    const order = await Order.findById(id);
    if (!order) {
      console.log("❌ Order not found");
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    console.log("✅ Order found");
    res.json({ success: true, data: order });
  } catch (error) {
    console.error("🔥 Error fetching order:", error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch order' });
  }
};

// ──────────────────────────────────────────────
// UPDATE ITEM STATUS (with optional billUrl)
// ──────────────────────────────────────────────
export const updateItemStatus = async (req, res) => {
  const { orderId, itemId } = req.params;
  const { status, assignedTo, billUrl } = req.body;

  console.log("📥 updateItemStatus called");
  console.log("   orderId:", orderId);
  console.log("   itemId:", itemId);
  console.log("   req.body:", req.body);
  console.log("   assignedTo:", assignedTo);
  console.log("   billUrl:", billUrl);

  const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'assigned', 'confirmed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // ✅ FIX: Only require bill if item doesn't already have one
    if (status === 'processing' && !billUrl && !item.billUrl) {
      return res.status(400).json({
        success: false,
        message: 'Bill must be uploaded before accepting the order.'
      });
    }

    // Update fields
    item.status = status;
    if (assignedTo !== undefined) {
      item.assignedTo = assignedTo;
    }
    if (billUrl !== undefined) {
      item.billUrl = billUrl;
    }

    await order.save();
    console.log("✅ Order saved. Item assignedTo:", item.assignedTo);

    res.json({ success: true, data: order, message: 'Item status updated' });
  } catch (error) {
    console.error("🔥 Error updating item status:", error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update item status' });
  }
};

// ──────────────────────────────────────────────
// UPLOAD BILL FOR AN ORDER ITEM
// ──────────────────────────────────────────────
export const uploadBill = async (req, res) => {
  const { orderId, itemId } = req.params;
  console.log(`📥 Upload bill for order ${orderId}, item ${itemId}`);

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const billUrl = `/imgUploads/${req.file.filename}`;
    item.billUrl = billUrl;
    await order.save();

    console.log(`✅ Bill uploaded: ${billUrl}`);
    res.json({ success: true, billUrl });
  } catch (error) {
    console.error("🔥 Error uploading bill:", error);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload bill' });
  }
};

// ──────────────────────────────────────────────
// DELETE ITEM FROM ORDER
// ──────────────────────────────────────────────
export const deleteItemFromOrder = async (req, res) => {
  const { orderId, itemId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    order.items.pull(itemId);

    if (order.items.length === 0) {
      await Order.findByIdAndDelete(orderId);
      return res.json({
        success: true,
        message: 'Last item deleted, order removed',
      });
    }

    order.total = order.items.reduce(
      (sum, i) => sum + (i.mrp || 0) * (i.quantity || 1),
      0
    );

    await order.save();

    res.json({
      success: true,
      data: order,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    console.error("🔥 Error deleting item:", error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete item',
    });
  }
};

// ──────────────────────────────────────────────
// UPDATE ORDER STATUS
// ──────────────────────────────────────────────
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled', 'assigned'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    order.status = status;
    await order.save();
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};