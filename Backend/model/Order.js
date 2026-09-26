import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
  {
    // Store
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: true,
    },

    shopid: {
      type: String,
      default: '',
    },

    // Customer who placed the order
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppUser',
      required: true,
      index: true,
    },

    // Order type
    orderType: {
      type: String,
      enum: ['normal', 'prescription'],
      default: 'normal',
      index: true,
    },

    // Prescription reference
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      default: null,
      index: true,
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
          enum: [
            'pending',
            'processing',
            'completed',
            'cancelled',
            'assigned',
            'confirmed',
          ],
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

    total: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'completed',
        'cancelled',
        'assigned',
        'confirmed',
      ],
      default: 'pending',
    },
  },

  {
    timestamps: true,
  }
);

// Indexes
OrderSchema.index({ storeId: 1 });
OrderSchema.index({ shopid: 1 });
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ orderType: 1 });
OrderSchema.index({ prescriptionId: 1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', OrderSchema);