import express from "express";

import {
  sendOTP,
  verifyOTP,
} from "../AppControllers/AppAuthController.js";

const router = express.Router();

router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "App API is working",
  });
});

router.post("/auth/send-otp", sendOTP);

router.post("/auth/verify-otp", verifyOTP);

export default router;