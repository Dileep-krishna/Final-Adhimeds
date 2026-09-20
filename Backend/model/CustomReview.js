import mongoose from 'mongoose';

const customReviewSchema = new mongoose.Schema(
  {
    reviewerName: { type: String, required: true, trim: true },
    reviewerImage: { type: String, default: '' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewDate: { type: Date, default: null },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    images: { type: [String], default: [] },
    isCustom: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'hidden', 'reported'], default: 'active' },
  },
  { timestamps: true }
);

const CustomReview = mongoose.model('CustomReview', customReviewSchema);
export default CustomReview;