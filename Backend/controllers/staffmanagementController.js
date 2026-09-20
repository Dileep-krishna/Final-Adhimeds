// controllers/staffmanagementController.js
import mongoose from 'mongoose';
import StaffMember from '../model/staffmanagementModel.js';
import Role from '../model/Role.js';

// List of all Kerala districts (must match schema enum)
const KERALA_DISTRICTS = [
  'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam',
  'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta',
  'Thiruvananthapuram', 'Thrissur', 'Wayanad'
];

// Helper functions
const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
const isValidPhone = (phone) => /^\+?[0-9\s\-\(\)]{10,15}$/.test(phone);
const isValidDate = (date) => !isNaN(new Date(date).getTime());
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const allowedStatuses = ['active', 'inactive', 'pending'];

// Helper: convert role name → ObjectId
const getRoleIdByName = async (roleName) => {
  if (!roleName) return null;
  const role = await Role.findOne({ name: roleName });
  return role?._id || null;
};

// -------------------------------
// 1. ADD a new staff member
// -------------------------------
export const addStaff = async (req, res) => {
  try {
    const { fullName, phone, joiningDate, email, role, storeId, status, password, district } = req.body;

    const requiredFields = ['fullName', 'phone', 'email', 'role', 'password', 'district'];
    const missing = requiredFields.filter(field => !req.body[field]);
    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(', ')}` });
    }

    if (fullName.trim().length < 2)
      return res.status(400).json({ success: false, message: 'Full name min 2 chars' });
    if (!isValidEmail(email))
      return res.status(400).json({ success: false, message: 'Invalid email' });
    if (!isValidPhone(phone))
      return res.status(400).json({ success: false, message: 'Invalid phone' });
    if (!password || password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    if (!KERALA_DISTRICTS.includes(district))
      return res.status(400).json({ success: false, message: `Invalid district. Must be one of: ${KERALA_DISTRICTS.join(', ')}` });

    const roleId = await getRoleIdByName(role);
    if (!roleId)
      return res.status(400).json({ success: false, message: `Role "${role}" not found` });

    let validJoiningDate = joiningDate ? new Date(joiningDate) : new Date();
    if (joiningDate && !isValidDate(joiningDate))
      return res.status(400).json({ success: false, message: 'Invalid joining date' });
    if (validJoiningDate > new Date())
      return res.status(400).json({ success: false, message: 'Joining date cannot be future' });

    if (storeId && !isValidObjectId(storeId))
      return res.status(400).json({ success: false, message: 'Invalid storeId' });

    const finalStatus = allowedStatuses.includes(status) ? status : 'active';

    const existing = await StaffMember.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const newStaff = new StaffMember({
      fullName: fullName.trim(),
      phone: phone.trim(),
      joiningDate: validJoiningDate,
      email: email.toLowerCase().trim(),
      role: roleId,
      storeId: storeId || null,
      status: finalStatus,
      password,
      district: district.trim(),
    });

    const saved = await newStaff.save();
    await saved.populate('role', 'name');
    const staffData = saved.toObject();
    delete staffData.password;

    res.status(201).json({ success: true, data: staffData });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ success: false, message: 'Duplicate email' });
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// -------------------------------
// 2. GET all staff (with filters & pagination) – optimized
// -------------------------------
export const getAllStaff = async (req, res) => {
  try {
    let { role, storeId, status, search, district, page = 1, limit = 10 } = req.query;
    page = parseInt(page) || 1;
    limit = Math.min(parseInt(limit) || 10, 100);
    const filter = {};

    if (role) {
      const roleDoc = await Role.findOne({ name: role });
      if (!roleDoc)
        return res.status(400).json({ success: false, message: 'Invalid role filter' });
      filter.role = roleDoc._id;
    }
    if (storeId && isValidObjectId(storeId)) filter.storeId = storeId;
    if (status && allowedStatuses.includes(status)) filter.status = status;
    if (district && KERALA_DISTRICTS.includes(district)) filter.district = district;

    if (search && typeof search === 'string') {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { fullName: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { phone: { $regex: escaped, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [staff, total] = await Promise.all([
      StaffMember.find(filter)
        .select('-password')
        .populate('role', 'name')
        .populate('storeId', 'storeName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      StaffMember.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: staff,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// -------------------------------
// 3. GET a single staff member by ID
// -------------------------------
export const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ success: false, message: 'Invalid staff ID' });

    const staff = await StaffMember.findById(id)
      .select('-password')
      .populate('role', 'name')
      .populate('storeId', 'storeName')
      .lean();

    if (!staff)
      return res.status(404).json({ success: false, message: 'Staff not found' });

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// -------------------------------
// 4. UPDATE a staff member (with fullName fix)
// -------------------------------
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ success: false, message: 'Invalid staff ID' });

    const updateData = req.body;
    const allowedUpdates = ['fullName', 'phone', 'joiningDate', 'email', 'role', 'storeId', 'status', 'password', 'district'];
    const filtered = {};

    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        if (key === 'fullName') {
          if (updateData.fullName.trim().length < 2)
            return res.status(400).json({ success: false, message: 'Full name min 2 chars' });
          filtered.fullName = updateData.fullName.trim();
        } else if (key === 'email') {
          if (!isValidEmail(updateData.email))
            return res.status(400).json({ success: false, message: 'Invalid email' });
          filtered.email = updateData.email.toLowerCase().trim();
        } else if (key === 'phone') {
          if (!isValidPhone(updateData.phone))
            return res.status(400).json({ success: false, message: 'Invalid phone' });
          filtered.phone = updateData.phone.trim();
        } else if (key === 'role') {
          const roleId = await getRoleIdByName(updateData.role);
          if (!roleId)
            return res.status(400).json({ success: false, message: 'Invalid role' });
          filtered.role = roleId;
        } else if (key === 'joiningDate' && updateData.joiningDate) {
          if (!isValidDate(updateData.joiningDate))
            return res.status(400).json({ success: false, message: 'Invalid joining date' });
          const dateObj = new Date(updateData.joiningDate);
          if (dateObj > new Date())
            return res.status(400).json({ success: false, message: 'Joining date cannot be future' });
          filtered.joiningDate = dateObj;
        } else if (key === 'storeId') {
          if (updateData.storeId && !isValidObjectId(updateData.storeId))
            return res.status(400).json({ success: false, message: 'Invalid storeId' });
          filtered.storeId = updateData.storeId || null;
        } else if (key === 'status') {
          if (!allowedStatuses.includes(updateData.status))
            return res.status(400).json({ success: false, message: 'Invalid status' });
          filtered.status = updateData.status;
        } else if (key === 'password') {
          if (updateData.password && updateData.password.length < 6)
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
          filtered.password = updateData.password;
        } else if (key === 'district') {
          if (!KERALA_DISTRICTS.includes(updateData.district))
            return res.status(400).json({ success: false, message: `Invalid district. Must be one of: ${KERALA_DISTRICTS.join(', ')}` });
          filtered.district = updateData.district.trim();
        }
      }
    }

    if (Object.keys(filtered).length === 0)
      return res.status(400).json({ success: false, message: 'No valid fields to update' });

    // Email uniqueness check
    if (filtered.email) {
      const existing = await StaffMember.findOne({ email: filtered.email, _id: { $ne: id } });
      if (existing)
        return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const updated = await StaffMember.findByIdAndUpdate(id, filtered, { new: true, runValidators: true })
      .select('-password')
      .populate('role', 'name')
      .populate('storeId', 'storeName');

    if (!updated)
      return res.status(404).json({ success: false, message: 'Staff not found' });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ success: false, message: 'Duplicate email' });
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// -------------------------------
// 5. DELETE a staff member
// -------------------------------
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ success: false, message: 'Invalid staff ID' });

    const deleted = await StaffMember.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ success: false, message: 'Staff not found' });

    res.status(200).json({ success: true, message: 'Staff deleted successfully', data: deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all Kerala districts
export const getAllDistricts = (req, res) => {
  res.status(200).json({
    success: true,
    data: KERALA_DISTRICTS
  });
};