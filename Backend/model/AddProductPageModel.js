import mongoose from 'mongoose';

// Sub‑schema for attribute value with pack sizes
const attributeValueSchema = new mongoose.Schema({
  value: { type: String, trim: true, required: true },
  packSizes: [{ type: String, trim: true }]   // array of pack size strings
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    // Basic Info
    productName: { type: String, trim: true, default: '' },
    mainCategory: { type: String, trim: true, default: '' },
    brand: { type: String, trim: true, default: '' },

    // Configuration
    relatedCategories: [{ type: String, trim: true }],
    unit: { type: String, trim: true, default: '' },
    weight: { type: Number, min: 0, default: 0 },
    minPurchaseQty: { type: Number, min: 1, default: 1 },

    // Tags
    tags: [{ type: String, trim: true }],

    // Settings
    published: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    todaysDeal: { type: Boolean, default: false },
    refundable: { type: Boolean, default: false },
    refundNote: { type: String, default: 'This product is eligible for return within 7 days of delivery.' },

    // Files & Media
    thumbnail: { type: String, default: '' },
    galleryImages: [{ type: String }],

    // Description
    description: { type: String, default: '' },

    // SEO
    metaTitle: { type: String, trim: true, default: '' },
    metaDescription: { type: String, trim: true, default: '' },
    metaImage: { type: String, default: '' },

    // Shipping
    freeShipping: { type: Boolean, default: true },
    flatRate: { type: Boolean, default: false },
    quantityMultiply: { type: Boolean, default: false },
    shippingDays: { type: String, trim: true, default: '' },
    shippingNote: { type: String, default: 'This product is shipped within 2-3 business days.' },

    // Cash on Delivery
    codAvailable: { type: Boolean, default: false },
    codNote: { type: String, default: 'Cash on delivery available for orders within India.' },

    // Price & Stock – UPDATED attributes structure
    attributes: [{
      name: { type: String, trim: true },
      values: [attributeValueSchema]   // now an array of objects with value + packSizes
    }],
    unitPrice: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    discountStartDate: { type: Date, default: null },
    discountEndDate: { type: Date, default: null },
    stock: { type: Number, min: 0, default: 0 },
    sku: { type: String, trim: true, default: '' },
    barcode: { type: String, trim: true, default: '' },
    externalLink: { type: String, trim: true, default: '' },
    externalLinkText: { type: String, trim: true, default: '' },
    hsnCode: { type: String, trim: true, default: '' },
    gstRate: { type: Number, min: 0, max: 100, default: 0 },
    hideStock: {
      type: String,
      enum: ['none', 'text_only'],
      default: 'none'
    },
    lowStockWarning: { type: Number, min: 0, default: 0 },
    quantity: { type: Number, min: 1, default: 1 },

    // Frequently Bought Together
    frequentlyBought: [{
      product: { type: String, trim: true },
      category: { type: String, trim: true }
    }]
  },
  {
    timestamps: true
  }
);

// Optional: indexes
productSchema.index({ productName: 1 });
productSchema.index({ mainCategory: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ barcode: 1 });
productSchema.index({ published: 1 });
productSchema.index({ 'attributes.name': 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;