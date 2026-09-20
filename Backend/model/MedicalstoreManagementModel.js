import mongoose from "mongoose";

const medicalStoreSchema = new mongoose.Schema(
  {
    // Required fields (store name + location)
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },

    // Optional fields (user may leave empty)
    searchLocation: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending',
    },
    vendorCategory: {
      type: String,
      enum: ['medical store', 'Lab test', 'Ayurveda store'],
    },
    pincode: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be exactly 6 digits'],
    },
    emailAddress: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    thumbnailImages: {
      type: [String],
      default: [],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
    },
    drugLicenseNumber: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
      match: [/^\d{10}$/, 'Contact number must be 10 digits'],
    },
    pharmacistName: {
      type: String,
      trim: true,
    },

    // ✅ Medisoft Shop ID
    shopid: {
      type: String,
      default: '',
      trim: true,
    },

    // ✅ NEW: District (auto‑detected or manually set)
    district: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for location-based queries
medicalStoreSchema.index({ latitude: 1, longitude: 1 });

// ✅ Index for fast district filtering (useful for order routing)
medicalStoreSchema.index({ district: 1 });

const MedicalStore = mongoose.model('MedicalStore', medicalStoreSchema);
export default MedicalStore;