'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import './roles-custom.css'; // make sure this file contains the toggle-switch styles
import { getRoleById, getRolePermissions, setRolePermissions, updateRole } from '../../../../services/permissionService';

// ✅ Moved outside component to avoid recreation on each render
const permissionModules = {
  Dashboard: ['View Dashboard'],
  'Order Management': ['View Orders'],
  Notifications: ['View Notifications'],
  Reports: ['View Reports'],
  Settings: ['View Settings'],
  'Products Home': ['View All Products', 'Add Product'],
  'Product Setup': [
    'View Category',
    'View Brands',
    'Add Brand',
    'Brand Bulk Import',
    'View Colors',
    'View Attribute',
    'View Size Guide',
    'View Measurement Points',
    'View Warranty',
    'View All Notes',
    'Add Note',
  ],
  'Product Operation': [
    'View Product Reviews',
    'View Smart Bar',
    'View Custom Label',
    'Bulk Import',
    'Bulk Export',
  ],
};

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params?.id;

  const [roleName, setRoleName] = useState('');
  const [originalRoleName, setOriginalRoleName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissionsData, setPermissionsData] = useState({});

  // Load role & permissions
  useEffect(() => {
    if (!roleId) {
      toast.error('No role ID provided');
      router.push('/super-admin/staff');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const roleRes = await getRoleById(roleId);
        if (!roleRes.success) {
          toast.error(roleRes.message || 'Role not found');
          router.push('/super-admin/staff/RoleDashboard');
          return;
        }
        const role = roleRes.data;
        setRoleName(role.name);
        setOriginalRoleName(role.name);

        const permRes = await getRolePermissions(role.name);
        if (permRes.success && permRes.data) {
          const permsObj = {};
          permRes.data.forEach(({ module, actions }) => {
            permsObj[module] = actions;
          });
          setPermissionsData(permsObj);
        } else {
          setPermissionsData({});
        }
      } catch (error) {
        console.error(error);
        toast.error('Error loading role data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [roleId]); // ✅ removed router from deps – it's stable

  // ✅ useCallback prevents recreation of this function
  const togglePermission = useCallback((module, action) => {
    setPermissionsData((prev) => {
      const current = prev[module] || [];
      const updated = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];

      const newData = { ...prev };
      if (updated.length === 0) delete newData[module];
      else newData[module] = updated;
      return newData;
    });
  }, []);

  const hasPermission = (module, action) =>
    permissionsData[module]?.includes(action) || false;

  const handleSave = useCallback(async () => {
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    setSaving(true);
    try {
      if (roleName.trim() !== originalRoleName) {
        const updateRes = await updateRole(roleId, { name: roleName.trim() });
        if (!updateRes.success) {
          toast.error(updateRes.message || 'Failed to update role name');
          setSaving(false);
          return;
        }
      }

      const finalRoleName = roleName.trim();
      const permissionsArray = Object.entries(permissionsData).map(
        ([module, actions]) => ({ module, actions })
      );
      const permResult = await setRolePermissions(finalRoleName, permissionsArray);
      if (permResult.success) {
        toast.success('Role and permissions updated successfully');
        router.push('/super-admin/staff/RoleDashboard');
      } else {
        toast.error(permResult.message || 'Permissions not saved');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error while saving');
    } finally {
      setSaving(false);
    }
  }, [roleName, originalRoleName, roleId, permissionsData, router]);

  if (loading) {
    return (
      <div className="roles-design-page">
        <div className="container-fluid py-4 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="roles-design-page">
      <Toaster position="top-right" />
      <div className="container-fluid py-4">
        <div className="role-info-card">
          <h3 className="card-title">
            <i className="bi bi-info-circle-fill"></i> Edit Role
          </h3>
          <div className="form-group">
            <label htmlFor="roleName">Role Name</label>
            <input
              type="text"
              id="roleName"
              className="form-control"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Role name"
            />
          </div>
        </div>

        <div className="permissions-section">
          <h3 className="section-title">
            <i className="bi bi-grid-3x3-gap-fill"></i> Permissions for{' '}
            <span className="role-highlight">{roleName}</span>
          </h3>
          <div className="permissions-grid">
            {Object.entries(permissionModules).map(([module, actions]) => (
              <div className="permission-card" key={module}>
                <div className="permission-header">
                  <i className="bi bi-folder2-open"></i> {module}
                </div>
                <div className="permission-body">
                  {actions.map((action) => (
                    <label key={`${module}-${action}`} className="permission-item">
                      {/* ✅ Toggle switch – no checkbox visible */}
                      <div className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={hasPermission(module, action)}
                          onChange={() => togglePermission(module, action)}
                        />
                        <span className="toggle-slider"></span>
                      </div>
                      <span className="permission-label">{action}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="permission-hint">
          <i className="bi bi-info-circle"></i> Toggle ON/OFF to grant or revoke access.
        </div>

        <div className="save-footer">
          <button className="btn-save-all" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-save"></i> Update Role & Permissions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}