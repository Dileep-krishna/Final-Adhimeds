import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Deliveryboys from "../../model/deliveryboysModel.js";

const generateDeliveryToken = (deliveryBoyId) => {
  return jwt.sign(
    {
      deliveryBoyId,
      role: "delivery_boy",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};


// ======================================================
// DELIVERY BOY LOGIN
// Phone OR Email + Password
// ======================================================

export const deliveryLogin = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone/email and password are required",
      });
    }

    const cleanLogin = login.trim();

    const deliveryBoy = await Deliveryboys.findOne({
      $or: [
        {
          email: {
            $regex: `^${cleanLogin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i",
          },
        },
        {
          phone: cleanLogin,
        },
      ],
    });

    if (!deliveryBoy) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone/email or password",
      });
    }

    if (deliveryBoy.status !== "active") {
      return res.status(403).json({
        success: false,
        message: `Your account is ${deliveryBoy.status}`,
      });
    }

    if (!deliveryBoy.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Your account is not verified",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      deliveryBoy.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone/email or password",
      });
    }

    const token = jwt.sign(
      {
        deliveryBoyId: deliveryBoy._id,
        role: "delivery_boy",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        deliveryBoy: {
          id: deliveryBoy._id,
          name: deliveryBoy.name,
          email: deliveryBoy.email,
          phone: deliveryBoy.phone,
          aadharNumber: deliveryBoy.aadharNumber,
          licenseNumber: deliveryBoy.licenseNumber,
          bikeNumber: deliveryBoy.bikeNumber,
          district: deliveryBoy.district,
          isPhoneVerified: deliveryBoy.isPhoneVerified,
          isVerified: deliveryBoy.isVerified,
          isAvailable: deliveryBoy.isAvailable,
          status: deliveryBoy.status,
        },
      },
    });
  } catch (error) {
    console.error("Delivery login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};