'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getAllRoles, deleteRole } from '../../../services/permissionService';
import './roles-all.css';

export default function AllRolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch roles from API
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await getAllRoles();
      if (res.success) {
        setRoles(res.data);
      } else {
        toast.error(res.message || 'Failed to load roles');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error while loading roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Delete role with confirmation
  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the role "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await deleteRole(id);
      if (res.success) {
        toast.success(`Role "${name}" deleted successfully`);
        fetchRoles(); // refresh list
      } else {
        toast.error(res.message || 'Delete failed');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error while deleting');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="roles-page">
      <Toaster position="top-right" />

      {/* ===== HERO SECTION (matching staff page) ===== */}
      <div className="roles-hero">
        <div>
          <div className="hero-title">
            <i className="bi bi-person-badge"></i> All Roles
          </div>
          <div className="hero-subtitle">Manage system roles and permissions</div>
        </div>
        <div className="hero-buttons">
          <Link href="/super-admin/staff/RoleAdd" className="btn-glow">
            <i className="bi bi-plus-circle"></i> Add New Role
          </Link>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="roles-stats">
        <div className="stat-card">
          <i className="bi bi-person-badge"></i>
          <div>
            <span className="stat-number">{roles.length}</span>
            <span>Total Roles</span>
          </div>
        </div>
        <div className="stat-card">
          <i className="bi bi-shield-check"></i>
          <div>
            <span className="stat-number">{roles.length}</span>
            <span>Active Roles</span>
          </div>
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className="roles-table-wrapper">
        <table className="roles-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Role Name</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1"></i>
                  <p className="mt-2">No roles found. Click “Add New Role” to create one.</p>
                </td>
              </tr>
            ) : (
              roles.map((role, idx) => (
                <tr key={role._id}>
                  <td>{idx + 1}</td>
                  <td className="fw-medium">{role.name}</td>
                  <td>
                    <div className="actions-group">
                      <Link
                        href={`/super-admin/staff/rolesEdit/${role._id}`}
                        className="action-btn edit-btn"
                        title="Edit Role"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </Link>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(role._id, role.name)}
                        disabled={deletingId === role._id}
                        title="Delete Role"
                      >
                        {deletingId === role._id ? (
                          <span className="spinner-border spinner-border-sm" style={{ width: '0.8rem', height: '0.8rem' }}></span>
                        ) : (
                          <i className="bi bi-trash3"></i>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}