import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
  {
    // ✅ NEW: Link order to the store
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore', // or 'Store' depending on your model name
      required: true,
    },
    // Optional: store shopid for quick reference
    shopid: {
      type: String,
      default: '',
    },
    items: [
      {
        productName: String,
        storeName: String,
        mrp: Number,
        rate: Number,
        quantity: Number,
        stock: Number,
        qtyPerBox: Number,
        company: String,
        hsn: String,
        batch: String,
        expiry: String,
        pack: String,
        scheme: String,
        gst: String,
        status: {
          type: String,
          enum: ['pending', 'processing', 'completed', 'cancelled', 'assigned', 'confirmed'],
          default: 'pending',
        },
        assignedTo: {
          type: String,
          default: '',
        },
        billUrl: {
          type: String,
          default: '',
        },
      },
    ],
    total: Number,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled', 'assigned', 'confirmed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// ✅ Add index for faster queries
OrderSchema.index({ storeId: 1 });

export default mongoose.model('Order', OrderSchema);