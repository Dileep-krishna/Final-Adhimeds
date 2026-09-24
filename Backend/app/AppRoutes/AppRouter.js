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

import {
  deliveryLogin,
} from "../AppControllers/AppDeliveryAuthController.js";

import { storeLogin } from "../AppControllers/AppStoreAuthController.js";

import protectAppUser from "../AppMiddleware/AppAuthMiddleware.js";

import uploadPrescriptionFile from "../AppMiddleware/AppUploadMiddleware.js";

import {
  getAllPharmacists,
  getPharmacistsByDistrict,
  getPharmacistById,
} from "../AppControllers/AppPharmacyController.js";

import {
  getCategories,
  getSubcategories,
} from "../AppControllers/AppCategoryController.js";

import {
  getAllAppProducts,
  getProductsByCategory,
  getProductsBySubcategory,
  getAppProductById,
  searchProducts,
} from "../AppControllers/AppProductController.js";

import {
  getAllAppBrands,
  getAppBrandById,
} from "../AppControllers/AppBrandController.js";

import {
  addCustomerReviewVideo,
  getCustomerReviewVideos,
} from "../AppControllers/AppCustomerReviewVideoController.js";

import protectStore from "../AppMiddleware/AppStoreAuthMiddleware.js";

import {
  getMedisoftShops,
} from "../AppControllers/AppMedisoftController.js";

import {
  getMedisoftProducts,
} from "../AppControllers/AppMedisoftProductController.js";

import {
  getNewOrders,
  getOngoingOrders,
  getCompletedOrders,
  getCancelledOrders,
  getStoreOrderDetails,
  acceptStoreOrder,
  rejectStoreOrder,
  markOrderOngoing,
  markOrderDelivered,
  getStoreOrderHistory,
} from "../AppControllers/AppStoreOrderController.js";


const router = express.Router();


// =====================================================
// TEST
// =====================================================

router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "App API is working",
  });
});


// =====================================================
// CUSTOMER AUTH
// =====================================================

router.post(
  "/auth/send-otp",
  sendOTP
);

router.post(
  "/auth/verify-otp",
  verifyOTP
);


// =====================================================
// PRESCRIPTIONS
// =====================================================

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


// =====================================================
// ADDRESSES
// =====================================================

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


// =====================================================
// DELIVERY BOY AUTH
// =====================================================

router.post(
  "/delivery/auth/login",
  deliveryLogin
);


// =====================================================
// STORE AUTH
// =====================================================

router.post(
  "/store/auth/login",
  storeLogin
);


// =====================================================
// PHARMACISTS
// =====================================================

// All pharmacists
router.get(
  "/pharmacists",
  getAllPharmacists
);

// Pharmacists by district
router.get(
  "/pharmacists/:district",
  getPharmacistsByDistrict
);

// Single pharmacist
router.get(
  "/pharmacist/:id",
  getPharmacistById
);


// =====================================================
// CATEGORIES
// =====================================================

// All main categories
router.get(
  "/categories",
  getCategories
);

// Subcategories of selected category
router.get(
  "/categories/:categoryId/subcategories",
  getSubcategories
);


// =====================================================
// PRODUCTS
// =====================================================

router.get(
  "/products",
  getAllAppProducts
);

router.get(
  "/products/category/:categoryId",
  getProductsByCategory
);

router.get(
  "/products/subcategory/:subcategoryId",
  getProductsBySubcategory
);

router.get(
  "/products/:id",
  getAppProductById
);

router.get(
  "/products/search/:query",
  searchProducts
);


// =====================================================
// BRANDS
// =====================================================

router.get(
  "/brands",
  getAllAppBrands
);

router.get(
  "/brands/:id",
  getAppBrandById
);


// =====================================================
// CUSTOMER REVIEW VIDEOS
// =====================================================

router.post(
  "/customer-review-videos",
  addCustomerReviewVideo
);

router.get(
  "/customer-review-videos",
  getCustomerReviewVideos
);


// =====================================================
// MEDISOFT
// =====================================================

router.get(
  "/medisoft/shops",
  getMedisoftShops
);

router.get(
  "/medisoft/products/:shopId",
  getMedisoftProducts
);


// =====================================================
// STORE MOBILE ORDER APIs
// =====================================================


// -----------------------------------------------------
// NEW ORDERS
// -----------------------------------------------------

router.get(
  "/store/orders/new",
  getNewOrders
);


// -----------------------------------------------------
// ONGOING ORDERS
// -----------------------------------------------------

router.get(
  "/store/orders/ongoing",
  getOngoingOrders
);


// -----------------------------------------------------
// COMPLETED ORDERS
// -----------------------------------------------------

router.get(
  "/store/orders/completed",
  getCompletedOrders
);


// -----------------------------------------------------
// CANCELLED / REJECTED ORDERS
// -----------------------------------------------------

router.get(
  "/store/orders/cancelled",
  getCancelledOrders
);


// -----------------------------------------------------
// ACCEPTED + REJECTED ORDER HISTORY
// -----------------------------------------------------
// IMPORTANT:
// This must come BEFORE /:orderId
// -----------------------------------------------------

router.get(
  "/store/orders/history",
  getStoreOrderHistory
);


// -----------------------------------------------------
// SINGLE ORDER DETAILS
// -----------------------------------------------------

router.get(
  "/store/orders/:orderId",
  getStoreOrderDetails
);


// -----------------------------------------------------
// ACCEPT ORDER
// -----------------------------------------------------

router.post(
  "/store/orders/:orderId/accept",
  acceptStoreOrder
);


// -----------------------------------------------------
// REJECT ORDER
// -----------------------------------------------------

router.post(
  "/store/orders/:orderId/reject",
  rejectStoreOrder
);


// -----------------------------------------------------
// MOVE ORDER TO ONGOING
// -----------------------------------------------------

router.post(
  "/store/orders/:orderId/ongoing",
  markOrderOngoing
);


// -----------------------------------------------------
// MARK ORDER DELIVERED
// -----------------------------------------------------

router.post(
  "/store/orders/:orderId/delivered",
  markOrderDelivered
);


export default router;