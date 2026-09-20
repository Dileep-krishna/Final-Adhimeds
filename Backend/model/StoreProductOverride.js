import mongoose from 'mongoose';

const storeProductOverrideSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    overrides: {
      productName: String,
      brand: String,
      mainCategory: String,
      unitPrice: Number,
      discount: Number,
      discountType: { type: String, enum: ['percent', 'fixed'] },
      discountStartDate: Date,
      discountEndDate: Date,
      stock: Number,
      published: Boolean,
      featured: Boolean,
      todaysDeal: Boolean,
      flashTitle: String,
      thumbnail: String,
      galleryImages: [String],
      description: String,
      metaTitle: String,
      metaDescription: String,
      freeShipping: Boolean,
      shippingDays: String,
      codAvailable: Boolean,
      hsnCode: String,
      gstRate: Number,
    },
    enabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

storeProductOverrideSchema.index({ storeId: 1, productId: 1 }, { unique: true });
storeProductOverrideSchema.index({ storeId: 1, enabled: 1 }); // optional performance

export default mongoose.model('StoreProductOverride', storeProductOverrideSchema);