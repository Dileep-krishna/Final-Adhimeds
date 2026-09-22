import mongoose from "mongoose";

const appAddressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppUser",
      required: true,
      index: true,
    },

    addressTitle: {
      type: String,
      default: "",
      trim: true,
    },

    name: {
      type: String,
      default: "",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    house: {
      type: String,
      default: "",
      trim: true,
    },

    street: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    district: {
      type: String,
      default: "",
      trim: true,
    },

    state: {
      type: String,
      default: "",
      trim: true,
    },

    pincode: {
      type: String,
      default: "",
      trim: true,
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    addressType: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const AppAddress = mongoose.model(
  "AppAddress",
  appAddressSchema
);

export default AppAddress;