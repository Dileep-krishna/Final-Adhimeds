import mongoose from "mongoose";

const deliveryBoySchema = new mongoose.Schema(
  {
    name: String,

    email: { type: String, unique: true },

    phone: { type: String, required: true, unique: true },

    password: { type: String, required: true },

    // Aadhar
    aadharNumber: { type: String, required: true },
    aadharImage: { type: String, required: true },

    // License
    licenseNumber: { type: String, required: true },
    licenseImage: { type: String, required: true },

    // Bike
    bikeNumber: { type: String, required: true },

    // District
    district: {
      type: String,
      required: true,
    },

    // Verification
    isPhoneVerified: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Deliveryboys = mongoose.model("deliveryboys", deliveryBoySchema);

export default Deliveryboys;