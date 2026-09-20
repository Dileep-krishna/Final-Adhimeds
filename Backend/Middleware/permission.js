// middleware/permission.js
export const requirePermission = (module, action) => {
  return async (req, res, next) => {
    try {
      // Assuming req.user is set after authentication
      const staff = req.user;
      if (!staff) return res.status(401).json({ success: false, message: 'Unauthorized' });

      // Populate the role with its permissions
      await staff.populate('role');

      const role = staff.role;
      const perm = role.permissions.find(p => p.module === module);
      if (!perm || !perm.actions.includes(action)) {
        return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
      }
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Permission check failed' });
    }
  };
};