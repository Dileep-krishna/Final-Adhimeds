import express from "express";

import {
  sendOTP,
  verifyOTP,
} from "../AppControllers/AppAuthController.js";

import {
  uploadPrescription,
  getPrescriptions,
  getPrescriptionById,
  deletePrescription,
  updatePrescription,
} from "../AppControllers/AppPrescriptionController.js";

import {
  addAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
} from "../AppControllers/AppAddressController.js";

import protectAppUser from "../AppMiddleware/AppAuthMiddleware.js";

import uploadPrescriptionFile from "../AppMiddleware/AppUploadMiddleware.js";

const router = express.Router();

router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "App API is working",
  });
});

router.post("/auth/send-otp", sendOTP);

router.post("/auth/verify-otp", verifyOTP);

router.post(
  "/prescriptions",
  protectAppUser,
  uploadPrescriptionFile.single("file"),
  uploadPrescription
);

router.get(
  "/prescriptions",
  protectAppUser,
  getPrescriptions
);

router.get(
  "/prescriptions/:id",
  protectAppUser,
  getPrescriptionById
);

router.put(
  "/prescriptions/:id",
  protectAppUser,
  uploadPrescriptionFile.single("file"),
  updatePrescription
);

router.delete(
  "/prescriptions/:id",
  protectAppUser,
  deletePrescription
);

router.post(
  "/addresses",
  protectAppUser,
  addAddress
);

router.get(
  "/addresses",
  protectAppUser,
  getAddresses
);

router.get(
  "/addresses/:id",
  protectAppUser,
  getAddressById
);

router.put(
  "/addresses/:id",
  protectAppUser,
  updateAddress
);

router.delete(
  "/addresses/:id",
  protectAppUser,
  deleteAddress
);

export default router;