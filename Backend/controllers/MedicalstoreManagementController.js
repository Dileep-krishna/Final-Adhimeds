// controllers/medicalStoreController.js
import MedicalStore from '../model/MedicalstoreManagementModel.js';
import bcrypt from 'bcrypt';

// ✅ Helper – matches static route "/imgUploads"
const getFileUrls = (files) => {
  if (!files || files.length === 0) return [];
  return files.map(file => `/imgUploads/${file.filename}`);
};

// ---------------------------
// 1. ADD a new medical store
// ---------------------------
export const addMedicalStore = async (req, res) => {
  try {
    const {
      storeName,
      shopid,
      latitude,
      longitude,
      searchLocation,
      address,
      status,
      vendorCategory,
      pincode,
      emailAddress,
      password,
      drugLicenseNumber,
      gstNumber,
      contactNumber,
      pharmacistName,
      district,
    } = req.body;

    if (!storeName || storeName.trim() === '') {
      return res.status(400).json({ success: false, message: 'Store name is required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude must be valid numbers' });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    let hashedPassword = undefined;
    if (password && password.trim()) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const thumbnailUrls = getFileUrls(req.files);

    const newStore = new MedicalStore({
      storeName: storeName.trim(),
      shopid: shopid?.trim() || '',
      latitude: lat,
      longitude: lng,
      searchLocation: searchLocation?.trim() || '',
      address: address?.trim() || '',
      status: status || 'pending',
      vendorCategory: vendorCategory || undefined,
      pincode: pincode?.trim() || undefined,
      emailAddress: emailAddress?.trim() || undefined,
      password: hashedPassword,
      drugLicenseNumber: drugLicenseNumber?.trim() || undefined,
      gstNumber: gstNumber?.trim() || undefined,
      contactNumber: contactNumber?.trim() || undefined,
      pharmacistName: pharmacistName?.trim() || undefined,
      thumbnailImages: thumbnailUrls,
      district: district?.trim() || '',
    });

    const savedStore = await newStore.save();
    const { password: _, ...storeWithoutPassword } = savedStore.toObject();
    res.status(201).json({ success: true, data: storeWithoutPassword });
  } catch (error) {
    console.error('Error adding medical store:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ---------------------------
// 2. EDIT (update) an existing store
// ---------------------------
export const updateMedicalStore = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const allowedUpdates = [
      'storeName',
      'shopid',
      'searchLocation',
      'latitude',
      'longitude',
      'address',
      'status',
      'vendorCategory',
      'pincode',
      'emailAddress',
      'thumbnailImages',
      'drugLicenseNumber',
      'gstNumber',
      'contactNumber',
      'pharmacistName',
      'password',
      'district',
    ];

    const filteredUpdates = {};
    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        filteredUpdates[key] = updateData[key];
      }
    }

    if (filteredUpdates.password) {
      filteredUpdates.password = await bcrypt.hash(filteredUpdates.password, 10);
    }

    const updatedStore = await MedicalStore.findByIdAndUpdate(
      id,
      filteredUpdates,
      { new: true, runValidators: true }
    );

    if (!updatedStore) {
      return res.status(404).json({ success: false, message: 'Medical store not found' });
    }

    const { password: _, ...storeWithoutPassword } = updatedStore.toObject();
    res.status(200).json({ success: true, data: storeWithoutPassword });
  } catch (error) {
    console.error('Error updating medical store:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ---------------------------
// 3. DELETE a medical store
// ---------------------------
export const deleteMedicalStore = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStore = await MedicalStore.findByIdAndDelete(id);

    if (!deletedStore) {
      return res.status(404).json({ success: false, message: 'Medical store not found' });
    }

    res.status(200).json({ success: true, message: 'Medical store deleted successfully', data: deletedStore });
  } catch (error) {
    console.error('Error deleting medical store:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ---------------------------
// 4. GET all stores (with pagination & filtering) – UNCHANGED
// ---------------------------
export const getAllMedicalStores = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const stores = await MedicalStore.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await MedicalStore.countDocuments(filter);

    const storesWithoutPassword = stores.map(store => {
      const { password, ...rest } = store.toObject();
      return rest;
    });

    res.status(200).json({
      success: true,
      data: storesWithoutPassword,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching medical stores:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ---------------------------
// 5. GET a single store by ID
// ---------------------------
export const getMedicalStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await MedicalStore.findById(id);

    if (!store) {
      return res.status(404).json({ success: false, message: 'Medical store not found' });
    }

    const { password, ...storeWithoutPassword } = store.toObject();
    res.status(200).json({ success: true, data: storeWithoutPassword });
  } catch (error) {
    console.error('Error fetching medical store:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ---------------------------
// 6. NEW: GET stores for order routing (minimal fields)
// ---------------------------
export const getShopsForOrder = async (req, res) => {
  try {
    // Return only the fields needed for order routing
    const shops = await MedicalStore.find(
      {},
      'shopid storeName address district status'
    ).lean();

    // Map to match the expected frontend field names (name, address1, etc.)
    const formatted = shops.map(shop => ({
      shopid: shop.shopid,
      name: shop.storeName,
      address1: shop.address ? shop.address.split(',')[0] : '',
      address2: shop.address || '',
      pincode: shop.pincode || '',
      district: shop.district || '',
      status: shop.status || 'pending',
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching shops for order:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
export const getStoreByEmail = async (req, res) => {
   console.log('👉 getStoreByEmail called with query:', req.query);
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email query parameter is required' });
    }
    const store = await MedicalStore.findOne({ emailAddress: email.toLowerCase() }).lean();
    if (!store) {
      return res.status(404).json({ success: false, message: 'No store found with this email' });
    }
    res.json({
      success: true,
      storeId: store._id,
      storeName: store.storeName,
      email: store.emailAddress
    });
  } catch (error) {
    console.error('Error in getStoreByEmail:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};