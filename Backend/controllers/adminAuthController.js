import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Admin from '../model/Admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Token generation using ADMIN_JWT_SECRET ──────────────
const generateToken = (id, email, role) => {
  const secret = process.env.ADMIN_JWT_SECRET || 'super-admin';
  console.log("🔑 [SIGN] ADMIN_JWT_SECRET used:", secret.substring(0, 3) + "...");
  return jwt.sign({ id, email, role }, secret, { expiresIn: '7d' });
};

// ============================================================
//  ADMIN LOGIN
// ============================================================
export const adminLogin = async (req, res) => {
  console.log("📨 Login request received");
  console.log("   Body:", req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    console.log("❌ Missing email or password");
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  try {
    console.log("🔍 Looking for admin with email:", email);
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      console.log("❌ Admin not found");
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    console.log("✅ Admin found. Name:", admin.name);

    if (!admin.isActive) {
      console.log("❌ Account is inactive");
      return res.status(403).json({ success: false, message: 'Account disabled' });
    }

    let isMatch = false;
    if (admin.password && admin.password.startsWith('$2')) {
      console.log("🔐 Password is bcrypt hashed. Comparing...");
      isMatch = await bcrypt.compare(password, admin.password);
      console.log("   bcrypt compare result:", isMatch);
    } else if (admin.password === password) {
      console.log("⚠️ Password is plain text. Accepting and will hash.");
      isMatch = true;
      const hashed = await bcrypt.hash(password, 10);
      admin.password = hashed;
      await admin.save();
      console.log("✅ Password hashed and saved.");
    } else {
      console.log("❌ Password does not match (plain compare).");
    }

    if (!isMatch) {
      console.log("❌ Authentication failed – wrong password");
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    admin.lastLogin = new Date();
    await admin.save();
    console.log("✅ Last login updated");

    const token = generateToken(admin._id, admin.email, admin.role);
    const adminData = admin.toObject();
    delete adminData.password;

    console.log("🎉 Login successful for:", admin.email);
    console.log("🔑 Token generated (first 20 chars):", token.substring(0, 20) + "...");
    res.json({ success: true, data: { admin: adminData, token } });
  } catch (error) {
    console.error("🔥 Login error:", error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// ============================================================
//  GET CURRENT ADMIN PROFILE
// ============================================================
export const getCurrentAdmin = async (req, res) => {
  console.log("📥 getCurrentAdmin called");
  console.log("   req.user:", req.user ? `ID: ${req.user.id}` : 'undefined');

  try {
    if (!req.user) {
      console.log("❌ No user attached to request");
      return res.status(401).json({ success: false, message: 'Not authorized – no user data' });
    }

    const admin = await Admin.findById(req.user.id).select('-password -refreshToken');
    if (!admin) {
      console.log("❌ Admin not found for ID:", req.user.id);
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    console.log("✅ Admin fetched successfully:", admin.email);
    res.status(200).json({ success: true, data: admin });
  } catch (error) {
    console.error("❌ Error fetching admin:", error);
    res.status(500).json({ success: false, message: 'Server error while loading profile' });
  }
};

// ============================================================
//  UPDATE ADMIN PROFILE
// ============================================================
export const updateAdminProfile = async (req, res) => {
  console.log("📝 updateAdminProfile called");
  console.log("   req.user:", req.user ? `ID: ${req.user.id}` : 'undefined');
  console.log("   req.body:", req.body);
  console.log("   req.file:", req.file ? req.file.filename : 'none');

  try {
    if (!req.user) {
      console.log("❌ No user attached to request");
      return res.status(401).json({ success: false, message: 'Not authorized – no user data' });
    }

    const admin = await Admin.findById(req.user.id).select('+password');
    if (!admin) {
      console.log("❌ Admin not found for ID:", req.user.id);
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const { name, phone, currentPassword, newPassword } = req.body;

    if (name !== undefined) admin.name = name;
    if (phone !== undefined) admin.phone = phone;

    if (currentPassword || newPassword) {
      console.log("🔐 Password change requested");
      if (!currentPassword || !newPassword) {
        console.log("❌ Missing current or new password");
        return res.status(400).json({
          success: false,
          message: 'Both current and new password are required to change password',
        });
      }
      const isMatch = await admin.comparePassword(currentPassword);
      if (!isMatch) {
        console.log("❌ Current password is incorrect");
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      if (newPassword.length < 6) {
        console.log("❌ New password too short");
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      }
      admin.password = newPassword;
      console.log("✅ Password will be hashed on save");
    }

    if (req.file) {
      console.log("📸 Avatar file received:", req.file.filename);
      if (admin.avatar) {
        const oldPath = path.join(__dirname, '../uploads/avatars', admin.avatar);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
          console.log("🗑️ Old avatar deleted:", admin.avatar);
        }
      }
      admin.avatar = req.file.filename;
    }

    await admin.save();
    console.log("✅ Profile saved");

    const updatedAdmin = await Admin.findById(req.user.id).select('-password -refreshToken');
    console.log("✅ Returning updated admin");
    res.status(200).json({ success: true, data: updatedAdmin });
  } catch (error) {
    console.error("❌ Error updating admin:", error);
    res.status(500).json({ success: false, message: 'Server error while updating profile' });
  }
};

// ============================================================
//  DELETE AVATAR
// ============================================================
export const deleteAvatar = async (req, res) => {
  console.log("🗑️ deleteAvatar called");
  console.log("   req.user:", req.user ? `ID: ${req.user.id}` : 'undefined');

  try {
    if (!req.user) {
      console.log("❌ No user attached to request");
      return res.status(401).json({ success: false, message: 'Not authorized – no user data' });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      console.log("❌ Admin not found");
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (admin.avatar) {
      const filePath = path.join(__dirname, '../uploads/avatars', admin.avatar);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("🗑️ Avatar file deleted:", admin.avatar);
      }
      admin.avatar = '';
      await admin.save();
      console.log("✅ Avatar removed from DB");
    } else {
      console.log("ℹ️ No avatar to delete");
    }

    res.status(200).json({ success: true, message: 'Avatar removed successfully' });
  } catch (error) {
    console.error("❌ Error deleting avatar:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};