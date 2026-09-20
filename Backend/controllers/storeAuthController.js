import Store from '../model/StoreLogin.js';
import MedicalStore from '../model/MedicalstoreManagementModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-admin';

export const storeLogin = async (req, res) => {
  console.log('========================================');
  console.log('🔐 STORE LOGIN ATTEMPT');
  console.log('Request body:', req.body);
  console.log('========================================');

  try {
    const { emailAddress, password } = req.body;

    if (!emailAddress || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // 1. Try to find in StoreLogin collection
    let store = await Store.findOne({ emailAddress: emailAddress.toLowerCase() }).select('+password');
    let storeType = 'StoreLogin';
    let district = '';

    // 2. If not found, try MedicalStore collection
    if (!store) {
      console.log('Not found in StoreLogin, checking MedicalStore...');
      store = await MedicalStore.findOne({ emailAddress: emailAddress.toLowerCase() }).select('+password');
      storeType = 'MedicalStore';
    }

    if (!store) {
      console.log('❌ No store found in either collection');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log(`✅ Store found in ${storeType}`);
    console.log('   Store name:', store.storeName);
    console.log('   Status:', store.status);
    console.log('   shopid:', store.shopid || 'Not set');

    // ✅ NEW: Fetch district from MedicalStore (which has it)
    // If the store was found in MedicalStore directly, district is already available
    if (storeType === 'MedicalStore') {
      district = store.district || '';
    } else {
      // If found in StoreLogin, fetch district from MedicalStore using email or shopid
      try {
        const medicalStore = await MedicalStore.findOne({ 
          emailAddress: emailAddress.toLowerCase() 
        });
        district = medicalStore?.district || '';
        console.log('📌 Fetched district from MedicalStore:', district);
      } catch (err) {
        console.warn('Could not fetch district from MedicalStore:', err.message);
        district = '';
      }
    }

    console.log('   Password hash (first 10 chars):', store.password ? store.password.substring(0, 10) : 'MISSING');

    // 3. Compare password
    let isMatch = false;
    if (store.password.startsWith('$2a$') || store.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, store.password);
    } else {
      console.warn('⚠️ Password stored in plain text! Please re‑save the store to hash it.');
      isMatch = (password === store.password);
    }

    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 4. Check status
    if (store.status !== 'active') {
      console.log(`❌ Status is '${store.status}', expected 'active'`);
      return res.status(403).json({ success: false, message: 'Your account is not active. Contact admin.' });
    }

    // 5. Generate JWT token – include shopid
    const token = jwt.sign(
      {
        id: store._id,
        email: store.emailAddress,
        storeName: store.storeName,
        shopid: store.shopid || '',
        district: district, // ✅ Include district in token
        role: 'store',
        source: storeType
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 6. Return success – ✅ NOW INCLUDES DISTRICT
    console.log('🎉 Login successful!');
    console.log('📌 District returned:', district);
    res.status(200).json({
      success: true,
      storeId: store._id,
      shopid: store.shopid || '',
      storeName: store.storeName,
      email: store.emailAddress,
      district: district, // ✅ NEW: District field
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('💥 Store login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};