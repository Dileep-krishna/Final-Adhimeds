import RolePermission from '../model/RolePermission.js';   // ✅ correct



// Get permissions for a role by roleName
export const getRolePermissions = async (req, res) => {
  try {
    const { roleName } = req.params;
    const doc = await RolePermission.findOne({ roleName });
    res.json({ success: true, data: doc?.permissions || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Set (replace) permissions for a role
export const setRolePermissions = async (req, res) => {
  try {
    const { roleName } = req.params;
    const { permissions } = req.body; // array of { module, actions }
    const result = await RolePermission.findOneAndUpdate(
      { roleName },
      { permissions },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, data: result.permissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete permissions for a role (when role is deleted)
export const deleteRolePermissions = async (req, res) => {
  try {
    const { roleName } = req.params;
    await RolePermission.findOneAndDelete({ roleName });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};