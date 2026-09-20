import jwt from 'jsonwebtoken';
import Admin from '../model/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ success: false, message: 'Not authorized – no token provided' });
  }

  try {
    const secret = process.env.ADMIN_JWT_SECRET || 'super-admin';
    console.log('🔑 VERIFYING token with secret:', secret.substring(0, 3) + '...');
    const decoded = jwt.verify(token, secret);
    console.log('✅ Token verified for user:', decoded.id);

    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      console.log('❌ Admin not found for ID:', decoded.id);
      return res.status(401).json({ success: false, message: 'Not authorized – admin not found' });
    }

    req.user = admin;
    next();
  } catch (error) {
    console.error('🔴 JWT verification failed:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized – invalid token' });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized – user not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied – role '${req.user.role}' not allowed`,
      });
    }
    next();
  };
};