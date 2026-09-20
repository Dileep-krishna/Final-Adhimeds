import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      enum: ['In-House', 'Seller'],
      required: [true, 'User type is required'],
      default: 'In-House',
    },
    type: {
      type: String,
      enum: [
        'Shipping',
        'Refund',
        'Warranty',
        'Delivery',
        'Medical Advice',
        'Prescription',
        'Lab Result',
      ],
      required: [true, 'Note type is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    sellerCanAccess: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      default: null,
      // Stores: file path (e.g., "uploads/notes/12345.jpg") or full URL
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

// Optional: add text index for searching descriptions
NoteSchema.index({ description: 'text' });

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);