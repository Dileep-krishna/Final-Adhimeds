import express from "express";
import multer from "multer";

import multerConfig from "./middlewares/multerConfig.js";

// ✅ DELIVERY BOY CONTROLLERS
import {
  addDeliveryBoy,
  getAllDeliveryBoys,
  deleteDeliveryBoy,
  updateDeliveryBoy,
} from "./controllers/deliveryBoysController.js";

// ✅ CATEGORY CONTROLLERS
import {
  getCategories,
  getCategoryById,
  deleteCategory,
  updateCategory,
  createCategory,
  bulkExportCategories,
  downloadTemplate,
  bulkImportCategories,
} from "./controllers/categoryManagmentController.js";
import { addMedicalStore, deleteMedicalStore, getAllMedicalStores, getMedicalStoreById, getShopsForOrder, getStoreByEmail, updateMedicalStore } from "./controllers/MedicalstoreManagementController.js";
import { addStaff, deleteStaff, getAllDistricts, getAllStaff, getStaffById, updateStaff } from "./controllers/staffmanagementController.js";
import { createRole, deleteRole, getAllRoles, getRoleById, updateRole, updateRolePermissions } from "./controllers/roleController.js";
import { 
  addProduct, 
  deleteProduct, 
  getAllProducts, 
  getProductById, 
  updateProduct,
  getStoreProduct,
  updateStoreProduct,
  deleteStoreOverride,
  getCurrentStore,
  getAllStoreProducts,
  toggleProductAccessForStore,
  bulkExportProducts,
  bulkImportProducts,

} from "./controllers/productController.js";
import { deleteRolePermissions, getRolePermissions, setRolePermissions } from "./controllers/rolePermissionController.js";
import { bulkExportBrands, bulkImportBrands, createBrand, deleteBrand, getAllBrands, getBrandById, updateBrand } from "./controllers/brandController.js";
import { createWarranty, deleteWarranty, getAllWarranties, getWarrantyById, updateWarranty } from "./controllers/warrantyController.js";
import { createNote, deleteNote, getAllNotes, getNoteById, updateNote } from "./controllers/noteController.js";
import { createAttribute, deleteAttribute, getAttributeById, getAttributes, updateAttribute } from "./controllers/attributeController.js";
import { createColor, deleteColor, getColorById, getColors, updateColor } from "./controllers/colorController.js";
import { createCustomReview, deleteCustomReview, getAllCustomReviews, getCustomReviewById, updateCustomReview } from "./controllers/customReviewController.js";
import { storeLogin } from "./controllers/storeAuthController.js";
import { verifyStoreToken } from "./middlewares/jwtMiddleware.js";
import { staffLogin } from "./controllers/StaffLoginController.js";
import { createOrder,  deleteItemFromOrder,  getAllOrders, getOrderById, updateItemStatus, updateOrderStatus, uploadBill, } from "./controllers/orderController.js";
import {  createNotification, deleteAllNotifications, getNotifications, markNotificationRead } from "./controllers/notificationController.js";
import { deleteProductAccess, getStoreProductDetails, getStoreProducts, updateProductAccess, updateStoreProductPriceStock } from "./controllers/storeProductAccessController.js";
import { adminLogin, deleteAvatar, getCurrentAdmin, updateAdminProfile } from "./controllers/adminAuthController.js";
import { protect } from "./middlewares/adminJwtMiddleware.js";

const router = express.Router();

// ================= ADMIN AUTH (STATIC ROUTES – must come first) =================
router.post('/login', adminLogin);
router.get('/me', protect, getCurrentAdmin);
router.put('/update-profile', protect, multerConfig.single('avatar'), updateAdminProfile);
router.delete('/avatar', protect, deleteAvatar);


// ================= DELIVERY BOY ROUTES =================

router.post(
  "/add",
  multerConfig.fields([
    { name: "aadharImage", maxCount: 1 },
    { name: "licenseImage", maxCount: 1 },
  ]),
  addDeliveryBoy
);

router.get("/all", getAllDeliveryBoys);
router.delete("/:id", deleteDeliveryBoy);
router.put(
  "/:id",
  multerConfig.fields([
    { name: "aadharImage", maxCount: 1 },
    { name: "licenseImage", maxCount: 1 },
  ]),
  updateDeliveryBoy
);

// ================= CATEGORY ROUTES =================
// ─── Static routes (no :id parameter) ───
router.post(
  "/category/bulk-import",
  multerConfig.single("file"),
  async (req, res) => {
    try {
      await bulkImportCategories(req, res);
    } catch (error) {
      console.error("🔥 Route-level error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  "/category",
  multerConfig.fields([
    { name: "icon", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  createCategory
);

router.get("/category", getCategories);
router.get("/category/export", bulkExportCategories);        // ✅ before /:id
router.get("/category/template", downloadTemplate);          // ✅ before /:id
router.post(
  "/category/bulk-import",
  multerConfig.single("file"),
  bulkImportCategories
);

// ─── Dynamic routes (with :id parameter) – MUST COME LAST ───
router.get("/category/:id", getCategoryById);
router.put(
  "/category/:id",
  multerConfig.fields([
    { name: "icon", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  updateCategory
);
router.delete("/category/:id", deleteCategory);

// ================= STORE MANAGEMENT =================
router.post(
  '/store',
  multerConfig.array('thumbnailImages', 10),
  addMedicalStore
);
router.get('/store', getAllMedicalStores);
// ✅ Specific routes must come before generic :id
router.get('/store/by-email', getStoreByEmail);        // email lookup
router.get('/store/products', getAllStoreProducts);   // list store products
router.get('/store/:id', getMedicalStoreById);
router.put(
  '/store/:id',
  multerConfig.array('thumbnailImages', 10),
  updateMedicalStore
);
router.get('/medisoft/shops', getShopsForOrder); 
router.delete('/store/:id', deleteMedicalStore);

// ===============Store Product Access==============
router.put('/store/product-access/:productId/:storeId', updateProductAccess);
router.get('/store/products/:storeId', getStoreProducts);
router.delete('/store/product-access/:productId/:storeId', deleteProductAccess);
router.put('/store/product/:productId/:storeId', updateStoreProductPriceStock);
router.get('/store/product-details/:productId/:storeId', getStoreProductDetails);
// ================= STAFF ROUTES =================
router.post('/staff', addStaff);
router.get('/staff', getAllStaff);
router.get('/staff/:id', getStaffById);
router.put('/staff/:id', updateStaff);
router.delete('/staff/:id', deleteStaff);
// 👇 NEW: District list endpoint
router.get('/districts', getAllDistricts);

// ================= PERMISSION ROUTES =================
router.get('/roles', getAllRoles);
router.get('/roles/:id', getRoleById);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);

// ================= PRODUCT ROUTES (super-admin) =================
const productUploadFields = multerConfig.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'galleryImages', maxCount: 10 },
  { name: 'metaImage', maxCount: 1 },
  { name: 'videoFile', maxCount: 1 },
  { name: 'videoThumbnail', maxCount: 1 },
  { name: 'pdfSpec', maxCount: 1 },
]);

// ─── Bulk Import / Export (must come BEFORE /:id) ───
router.post('/products/bulk-import', multerConfig.single('file'), bulkImportProducts);
router.get('/products/export', bulkExportProducts);

// ─── CRUD routes ───
router.post('/products', productUploadFields, addProduct);
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.put('/products/:id', productUploadFields, updateProduct);
router.delete('/products/:id', deleteProduct);

// ================= ROLE PERMISSIONS =================
router.get('/role-permissions/:roleName', getRolePermissions);
router.put('/role-permissions/:roleName', setRolePermissions);
router.delete('/role-permissions/:roleName', deleteRolePermissions);

// ================= BRAND ROUTES =================
router.post('/brands/bulk-import', multerConfig.single('file'), bulkImportBrands);
router.get('/brands/export', bulkExportBrands);
router.get('/brands', getAllBrands);
router.get('/brands/:id', getBrandById);
router.post('/brands', multerConfig.single('logo'), createBrand);
router.put('/brands/:id', multerConfig.single('logo'), updateBrand);
router.delete('/brands/:id', deleteBrand);

// ================= WARRANTY ROUTES =================
router.get('/warranties', getAllWarranties);
router.get('/warranties/:id', getWarrantyById);
router.post('/warranties', multerConfig.single('logo'), createWarranty);
router.put('/warranties/:id', multerConfig.single('logo'), updateWarranty);
router.delete('/warranties/:id', deleteWarranty);

// ================= NOTE ROUTES =================
router.get('/notes', getAllNotes);
router.get('/notes/:id', getNoteById);
router.post('/notes', multerConfig.single('image'), createNote);
router.put('/notes/:id', multerConfig.single('image'), updateNote);
router.delete('/notes/:id', deleteNote);

// ================= ATTRIBUTE ROUTES =================
router.get('/attributes', getAttributes);
router.get('/attributes/:id', getAttributeById);
router.post('/attributes', createAttribute);
router.put('/attributes/:id', updateAttribute);
router.delete('/attributes/:id', deleteAttribute);

// ================= COLOR ROUTES =================
router.get('/colors', getColors);
router.get('/colors/:id', getColorById);
router.post('/colors', createColor);
router.put('/colors/:id', updateColor);
router.delete('/colors/:id', deleteColor);

// ================= CUSTOM REVIEW ROUTES =================
const customReviewRouter = express.Router();
const uploadFields = multerConfig.fields([
  { name: 'reviewerImage', maxCount: 1 },
  { name: 'newImages', maxCount: 10 }
]);

customReviewRouter.post('/', uploadFields, createCustomReview);
customReviewRouter.get('/', getAllCustomReviews);
customReviewRouter.get('/:id', getCustomReviewById);
customReviewRouter.put('/:id', uploadFields, updateCustomReview);
customReviewRouter.delete('/:id', deleteCustomReview);
router.use('/custom-reviews', customReviewRouter);



// ================= STORE LOGIN & AUTH =================
router.post('/store/login', storeLogin);
router.get('/auth/current-store', verifyStoreToken, getCurrentStore);

// ================= STORE PRODUCT OVERRIDE ROUTES =================
router.get("/store/products/:id", getStoreProduct);
router.put("/store/products/:id", updateStoreProduct);
router.delete("/store/products/:id/override", deleteStoreOverride);
router.put('/store/product-access/:productId/:storeId', toggleProductAccessForStore);
// ==============staff-login==================
router.post('/staff/login', staffLogin);
// ==============orders==================
router.post('/orders', createOrder);
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:orderId/items/:itemId', updateItemStatus);
router.delete('/orders/:orderId/items/:itemId', deleteItemFromOrder);
router.post(
  '/orders/:orderId/items/:itemId/upload-bill',
  multerConfig.single('bill'), // field name must be 'bill'
  uploadBill
);

router.put('/orders/:id/status', updateOrderStatus);
// ==============Notification==================
router.post('/notifications', createNotification);
router.get('/notifications', getNotifications);
router.put('/notifications/:id', markNotificationRead);
router.delete('/notifications', deleteAllNotifications);

router.get('/test-emit', (req, res) => {
  const io = req.app.get('io');
  if (io) {
    io.emit('new_order', {
      orderId: 'test-123',
      order: { items: [{ status: 'pending', _id: 'item1', productName: 'Test Product' }] }
    });
    res.send('Event emitted');
  } else {
    res.status(500).send('io not found');
  }
});

export default router;