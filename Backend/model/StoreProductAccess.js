import mongoose from 'mongoose';

const storeProductAccessSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: true,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    // ✅ These must be in the SCHEMA FIELDS, NOT in options
    customPrice: {
      type: Number,
      default: null,
    },
    customStock: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index
storeProductAccessSchema.index({ productId: 1, storeId: 1 }, { unique: true });

const StoreProductAccess = mongoose.model('StoreProductAccess', storeProductAccessSchema);
export default StoreProductAccess;