import Role from "../model/Role.js";

// Get all roles (only names)
export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find({}, 'name');
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single role by ID
export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new role
export const createRole = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }
    const existingRole = await Role.findOne({ name: name.trim() });
    if (existingRole) {
      return res.status(400).json({ success: false, message: 'Role already exists' });
    }
    const role = new Role({ name: name.trim() });
    await role.save();
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update role name
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }
    const role = await Role.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a role
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByIdAndDelete(id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Deprecated permission functions (return 410 Gone)
export const getRolePermissions = async (req, res) => {
  res.status(410).json({ success: false, message: 'Permissions are no longer supported in this version' });
};

export const updateRolePermissions = async (req, res) => {
  res.status(410).json({ success: false, message: 'Permissions are no longer supported in this version' });
};