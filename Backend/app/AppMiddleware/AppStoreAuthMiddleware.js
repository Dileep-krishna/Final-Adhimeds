import jwt from "jsonwebtoken";
import Store from "../../model/StoreLogin.js";
import MedicalStore from "../../model/MedicalstoreManagementModel.js";

const protectStore = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
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

    if (decoded.role !== "store") {
      return res.status(403).json({
        success: false,
        message: "Store access required",
      });
    }

    let store = null;

    // Find according to the collection stored in JWT
    if (decoded.source === "MedicalStore") {
      store = await MedicalStore.findById(decoded.storeId);
    } else {
      store = await Store.findById(decoded.storeId);
    }

    // Fallback: check both collections
    if (!store) {
      store = await Store.findById(decoded.storeId);

      if (!store) {
        store = await MedicalStore.findById(decoded.storeId);
      }
    }

    if (!store) {
      return res.status(401).json({
        success: false,
        message: "Store not found",
      });
    }

    if (store.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your store account is not active",
      });
    }

    req.store = store;
    req.storeSource = decoded.source;

    next();
  } catch (error) {
    console.error("Store authentication error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

export default protectStore;