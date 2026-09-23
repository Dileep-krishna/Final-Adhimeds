import Store from "../../model/StoreLogin.js";
import MedicalStore from "../../model/MedicalstoreManagementModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const storeLogin = async (req, res) => {
  try {
    const { emailAddress, password } = req.body;

    if (!emailAddress || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const email = emailAddress.trim().toLowerCase();

    // -----------------------------------------
    // 1. Check StoreLogin collection
    // -----------------------------------------
    let store = await Store.findOne({
      emailAddress: email,
    }).select("+password");

    let storeType = "StoreLogin";

    // -----------------------------------------
    // 2. If not found, check MedicalStore
    // -----------------------------------------
    if (!store) {
      store = await MedicalStore.findOne({
        emailAddress: email,
      }).select("+password");

      storeType = "MedicalStore";
    }

    if (!store) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // -----------------------------------------
    // 3. Get district
    // -----------------------------------------
    let district = "";

    if (storeType === "MedicalStore") {
      district = store.district || "";
    } else {
      const medicalStore = await MedicalStore.findOne({
        emailAddress: email,
      }).select("district");

      district = medicalStore?.district || "";
    }

    // -----------------------------------------
    // 4. Check password
    // -----------------------------------------
    let isMatch = false;

    if (
      store.password &&
      (store.password.startsWith("$2a$") ||
        store.password.startsWith("$2b$") ||
        store.password.startsWith("$2y$"))
    ) {
      isMatch = await bcrypt.compare(password, store.password);
    } else {
      // Support old plain-text passwords if any exist
      isMatch = password === store.password;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // -----------------------------------------
    // 5. Check account status
    // -----------------------------------------
    if (store.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active. Contact admin.",
      });
    }

    // -----------------------------------------
    // 6. Generate JWT
    // -----------------------------------------
    const token = jwt.sign(
      {
        storeId: store._id,
        email: store.emailAddress,
        shopid: store.shopid || "",
        role: "store",
        source: storeType,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    // -----------------------------------------
    // 7. Response
    // -----------------------------------------
    return res.status(200).json({
      success: true,
      message: "Login successful",

      data: {
        token,

        store: {
          id: store._id,
          storeName: store.storeName,
          emailAddress: store.emailAddress,
          shopid: store.shopid || "",
          vendorCategory: store.vendorCategory || "",
          pincode: store.pincode || "",
          address: store.address || "",
          searchLocation: store.searchLocation || "",
          latitude: store.latitude ?? null,
          longitude: store.longitude ?? null,
          drugLicenseNumber: store.drugLicenseNumber || "",
          gstNumber: store.gstNumber || "",
          contactNumber: store.contactNumber || "",
          pharmacistName: store.pharmacistName || "",
          thumbnailImages: store.thumbnailImages || [],
          status: store.status,
          district,
          source: storeType,
        },
      },
    });
  } catch (error) {
    console.error("Store login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during store login",
      error: error.message,
    });
  }
};