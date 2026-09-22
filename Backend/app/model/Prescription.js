import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppUser",
      required: true,
      index: true,
    },

    doctorName: {
      type: String,
      required: true,
      trim: true,
    },

    patientName: {
      type: String,
      required: true,
      trim: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    fileType: {
      type: String,
      enum: ["image", "pdf"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Prescription = mongoose.model(
  "Prescription",
  prescriptionSchema
);

export default Prescription;