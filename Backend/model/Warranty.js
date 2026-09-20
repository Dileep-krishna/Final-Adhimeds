// models/Warranty.js
import mongoose from 'mongoose';

const WarrantySchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Warranty text is required'],
      trim: true,
      unique: false, // allows same text for different warranties? Usually not, but keep optional
    },
    logo: {
      type: String, // stores base64 data URL or a file path/URL
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

// Optional: add text index for faster searches
WarrantySchema.index({ text: 1 });

// Prevent model recompilation error in Next.js API routes
export default mongoose.models.Warranty || mongoose.model('Warranty', WarrantySchema);