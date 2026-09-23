import Store from "../../model/StoreLogin.js";
import MedicalStore from "../../model/MedicalstoreManagementModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const storeLogin = async (req, res) => {
  try {
    const { login, password } = req.body;

    // -----------------------------------------
    // 1. Validate input
    // -----------------------------------------
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone/email and password are required",
      });
    }

    const cleanLogin = login.trim();

    // Check whether login is email or phone
    const isEmail = cleanLogin.includes("@");

    let store = null;
    let storeType = "";

    // -----------------------------------------
    // 2. Check StoreLogin collection
    // -----------------------------------------
    if (isEmail) {
      store = await Store.findOne({
        emailAddress: cleanLogin.toLowerCase(),
      }).select("+password");
    } else {
      let phone = cleanLogin.replace(/\D/g, "");

      // Convert +91XXXXXXXXXX / 91XXXXXXXXXX
      // into 10 digit phone number
      if (phone.length === 12 && phone.startsWith("91")) {
        phone = phone.substring(2);
      }

      store = await Store.findOne({
        contactNumber: phone,
      }).select("+password");
    }

    if (store) {
      storeType = "StoreLogin";
    }

    // -----------------------------------------
    // 3. If not found, check MedicalStore
    // -----------------------------------------
    if (!store) {
      if (isEmail) {
        store = await MedicalStore.findOne({
          emailAddress: cleanLogin.toLowerCase(),
        }).select("+password");
      } else {
        let phone = cleanLogin.replace(/\D/g, "");

        if (phone.length === 12 && phone.startsWith("91")) {
          phone = phone.substring(2);
        }

        store = await MedicalStore.findOne({
          contactNumber: phone,
        }).select("+password");
      }

      if (store) {
        storeType = "MedicalStore";
      }
    }

    // -----------------------------------------
    // 4. Store not found
    // -----------------------------------------
    if (!store) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone/email or password",
      });
    }

    // -----------------------------------------
    // 5. Get district
    // -----------------------------------------
    let district = "";

    if (storeType === "MedicalStore") {
      district = store.district || "";
    } else {
      // StoreLogin may not contain district.
      // Fetch it from MedicalStore.
      try {
        const medicalStore = await MedicalStore.findOne({
          emailAddress: store.emailAddress,
        }).select("district");

        district = medicalStore?.district || "";
      } catch (error) {
        console.warn(
          "Could not fetch district:",
          error.message
        );

        district = "";
      }
    }

    // -----------------------------------------
    // 6. Check password
    // -----------------------------------------
    let isMatch = false;

    if (
      store.password &&
      (
        store.password.startsWith("$2a$") ||
        store.password.startsWith("$2b$") ||
        store.password.startsWith("$2y$")
      )
    ) {
      isMatch = await bcrypt.compare(
        password,
        store.password
      );
    } else {
      // Legacy plain-text password support
      isMatch = password === store.password;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone/email or password",
      });
    }

    // -----------------------------------------
    // 7. Check store status
    // -----------------------------------------
    if (store.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your store account is not active. Contact admin.",
      });
    }

    // -----------------------------------------
    // 8. Generate JWT
    // -----------------------------------------
    const token = jwt.sign(
      {
        storeId: store._id,
        email: store.emailAddress,
        shopid: store.shopid || "",
        district: district,
        role: "store",
        source: storeType,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    // -----------------------------------------
    // 9. Return login response
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
          contactNumber: store.contactNumber || "",
          shopid: store.shopid || "",

          vendorCategory: store.vendorCategory || "",

          pincode: store.pincode || "",
          address: store.address || "",
          searchLocation: store.searchLocation || "",

          latitude: store.latitude ?? null,
          longitude: store.longitude ?? null,

          drugLicenseNumber:
            store.drugLicenseNumber || "",

          gstNumber:
            store.gstNumber || "",

          pharmacistName:
            store.pharmacistName || "",

          thumbnailImages:
            store.thumbnailImages || [],

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