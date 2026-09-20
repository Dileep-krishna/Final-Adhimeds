// middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ========== Store Authentication (existing) ==========
export const verifyStoreToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      storeId: decoded.id,
      email: decoded.email,
      storeName: decoded.storeName
    };
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireStore = (req, res, next) => {
  if (!req.user || !req.user.storeId) {
    return res.status(403).json({ success: false, message: 'Access denied. Store only.' });
  }
  next();
};

// ========== Staff Authentication (new) ==========
export const verifyStaffToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach staff info to req.staff
    req.staff = {
      staffId: decoded.id,
      role: decoded.role,
      district: decoded.district,
      fullName: decoded.fullName,
    };
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Role-based authorization for staff
export const authorizeStaff = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.staff) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.staff.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
};