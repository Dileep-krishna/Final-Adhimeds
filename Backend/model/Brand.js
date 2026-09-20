import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    logo: {
      type: String, // stores file path or URL (e.g., '/uploads/brand-logo.png')
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    metaTitle: {
      type: String,
      trim: true,
      default: '',
    },
    metaDescription: {
      type: String,
      trim: true,
      default: '',
    },
    metaKeywords: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Optional compound index for name + category (if needed)
brandSchema.index({ name: 1, category: 1 });

const Brand = mongoose.model('Brand', brandSchema);
export default Brand;