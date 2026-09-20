import mongoose from 'mongoose';
import StoreProductAccess from '../model/StoreProductAccess.js';

// ─── 1️⃣ UPDATE product access (enable/disable) ───
export const updateProductAccess = async (req, res) => {
  try {
    const { productId, storeId } = req.params;
    const { enabled } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ success: false, message: 'Invalid store ID' });
    }
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, message: 'enabled must be a boolean' });
    }

    const access = await StoreProductAccess.findOneAndUpdate(
      { productId, storeId },
      { enabled },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      data: access,
      message: `Product ${enabled ? 'enabled' : 'disabled'} for store`
    });
  } catch (error) {
    console.error('❌ Error updating product access:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 2️⃣ GET all products for a store ───
// ─── 2️⃣ GET all products for a store (with pagination, search, filter, sort) ───
export const getStoreProducts = async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      page = 1,
      limit = 10,
      search = '',
      filter = '',
      sort = ''
    } = req.query;

    // Validate storeId format
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ success: false, message: 'Invalid store ID' });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // ─── Build base filter for StoreAccess ───
    const accessFilter = {
      storeId: new mongoose.Types.ObjectId(storeId),  // ✅ use 'new'
      enabled: true,
      productId: { $ne: null }
    };

    // ─── Build filter for Product (search + filter) ───
    const productFilter = {};

    // Search: productName or brand (case‑insensitive)
    if (search) {
      productFilter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter: published, featured, todaysDeal, discount
    if (filter === 'published') productFilter.published = true;
    else if (filter === 'featured') productFilter.featured = true;
    else if (filter === 'todayDeal') productFilter.todaysDeal = true;
    else if (filter === 'discount') productFilter.discount = { $gt: 0 };

    // ─── Build sort object ───
    let sortObj = {};
    if (sort === 'price-asc') sortObj['productInfo.unitPrice'] = 1;
    else if (sort === 'price-desc') sortObj['productInfo.unitPrice'] = -1;
    else if (sort === 'name-asc') sortObj['productInfo.productName'] = 1;
    else if (sort === 'rating-desc') {
      // Fallback: rating sort not supported without extra aggregation
      sortObj['productInfo.productName'] = 1;
    } else {
      sortObj['createdAt'] = -1; // default newest first
    }

    // ─── Aggregation pipeline ───
    const pipeline = [
      { $match: accessFilter },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      { $match: productFilter },
      { $sort: sortObj },
      { $skip: skip },
      { $limit: limitNum }
    ];

    // ─── Count pipeline (same but without skip/limit) ───
    const countPipeline = [
      { $match: accessFilter },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      { $match: productFilter },
      { $count: 'total' }
    ];

    const [data, countResult] = await Promise.all([
      StoreProductAccess.aggregate(pipeline),
      StoreProductAccess.aggregate(countPipeline)
    ]);

    const total = countResult.length > 0 ? countResult[0].total : 0;

    // ─── Format response: replace productInfo with productId ───
    const formattedData = data.map(item => {
      const { productInfo, ...rest } = item;
      return {
        ...rest,
        productId: productInfo
      };
    });

    res.status(200).json({
      success: true,
      data: formattedData,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('❌ Error fetching store products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 3️⃣ DELETE product access record ───
export const deleteProductAccess = async (req, res) => {
  try {
    const { productId, storeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const deleted = await StoreProductAccess.findOneAndDelete({ productId, storeId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Access record not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Product access record deleted'
    });
  } catch (error) {
    console.error('❌ Error deleting product access:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 4️⃣ UPDATE store‑specific price & stock (AUTO-ENABLE) ───
export const updateStoreProductPriceStock = async (req, res) => {
  try {
    const { productId, storeId } = req.params;
    const { unitPrice, stock } = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    // Validate fields
    if (unitPrice === undefined || stock === undefined) {
      return res.status(400).json({ success: false, message: 'unitPrice and stock are required' });
    }

    // ✅ Update custom price/stock AND auto-enable the product
    const updated = await StoreProductAccess.findOneAndUpdate(
      { productId, storeId },
      {
        customPrice: unitPrice,
        customStock: stock,
        enabled: true,              // 👈 AUTO-ENABLE when updating price/stock
        updatedAt: new Date()
      },
      { new: true, runValidators: true, upsert: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    console.log(`✅ Updated product ${productId} for store ${storeId} -> price: ${unitPrice}, stock: ${stock}, enabled: true`);

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Store product price/stock updated successfully (auto-enabled)'
    });
  } catch (error) {
    console.error('❌ Error updating store product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// ─── 5️⃣ GET a single store product (with custom price/stock) ───
// ─── 5️⃣ GET store product details (with custom price/stock) ───
export const getStoreProductDetails = async (req, res) => {
  try {
    const { productId, storeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const access = await StoreProductAccess.findOne({ productId, storeId })
      .populate('productId')
      .lean();

    if (!access) {
      return res.status(404).json({ success: false, message: 'Product not enabled for this store' });
    }

    // Merge product with store‑specific overrides
    const product = access.productId;
    product.customPrice = access.customPrice;
    product.customStock = access.customStock;
    product.enabled = access.enabled;
    product.storeAccessId = access._id;

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('❌ Error fetching store product details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};