import jwt from "jsonwebtoken";
import AppUser from "../model/AppUser.js";

const generateToken = (userId) => {
  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10 digit phone number",
      });
    }

    let user = await AppUser.findOne({
      phone: cleanPhone,
    });

    let isNewUser = false;

    if (!user) {
      user = await AppUser.create({
        phone: cleanPhone,
      });

      isNewUser = true;
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        phone: cleanPhone,
        isNewUser,
      },
    });
  } catch (error) {
    console.error("Send OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    if (otp !== "123456") {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    let user = await AppUser.findOne({
      phone: cleanPhone,
    });

    if (!user) {
      user = await AppUser.create({
        phone: cleanPhone,
        isVerified: true,
        lastLoginAt: new Date(),
      });
    } else {
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your account has been disabled",
        });
      }

      user.isVerified = true;
      user.lastLoginAt = new Date();

      await user.save();
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
      error: error.message,
    });
  }
};