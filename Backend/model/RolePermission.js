import mongoose from 'mongoose';

const permissionEntrySchema = new mongoose.Schema({
  module: { type: String, required: true },
  actions: [{ type: String, required: true }]
});

const rolePermissionSchema = new mongoose.Schema({
  roleName: { type: String, required: true, unique: true }, // one document per role
  permissions: [permissionEntrySchema]
}, { timestamps: true });

const RolePermission = mongoose.model('RolePermission', rolePermissionSchema);
export default RolePermission;