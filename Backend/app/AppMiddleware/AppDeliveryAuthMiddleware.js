import jwt from "jsonwebtoken";
import Deliveryboys from "../model/deliveryboysModel.js";

const protectDeliveryBoy = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Make sure token belongs to Delivery Boy
    if (decoded.role !== "delivery_boy") {
      return res.status(403).json({
        success: false,
        message: "Delivery boy access required",
      });
    }

    const deliveryBoy = await Deliveryboys.findById(
      decoded.deliveryBoyId
    );

    if (!deliveryBoy) {
      return res.status(401).json({
        success: false,
        message: "Delivery boy not found",
      });
    }

    if (deliveryBoy.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    if (!deliveryBoy.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Your account is not verified",
      });
    }

    req.deliveryBoy = deliveryBoy;

    next();
  } catch (error) {
    console.error(
      "Delivery Auth Error:",
      error
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

export default protectDeliveryBoy;