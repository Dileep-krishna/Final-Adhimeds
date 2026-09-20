import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const storeSchema = new mongoose.Schema(
  {
    storeName: { type: String, required: true, trim: true },
    emailAddress: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    vendorCategory: { type: String, required: true, enum: ['medical store', 'Lab test', 'Ayurveda store'] },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    address: { type: String, required: true },
    searchLocation: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    drugLicenseNumber: { type: String, required: true },
    gstNumber: { type: String, required: true },
    contactNumber: { type: String, required: true, match: /^\d{10}$/ },
    pharmacistName: { type: String, required: true },
    thumbnailImages: [{ type: String }],
    status: { type: String, enum: ['pending', 'active', 'inactive'], default: 'pending' },
    shopid: { type: String, default: '' }, // ✅ Medisoft shop ID
  },
  { timestamps: true }
);

// Hash password before saving
storeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare entered password with hashed password
storeSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('Store', storeSchema);