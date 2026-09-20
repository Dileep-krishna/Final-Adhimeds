'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { createStaffAPI, getStaffAPI, updateStaffAPI, getAllDistricts } from '../../../services/staffService';
import { getAllRoles } from '../../../services/permissionService';
import './add-edit-staff.css';

export default function AddEditStaff() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    district: '',
    status: 'active',
    joinDate: new Date().toISOString().split('T')[0],
  });

  // ─── 1. Fetch roles & districts ───
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, districtsRes] = await Promise.all([
          getAllRoles(),
          getAllDistricts()
        ]);

        if (rolesRes.success && rolesRes.data) {
          const roleNames = rolesRes.data.map(r => r.name);
          setRoles(roleNames);
        } else {
          toast.error('Failed to load roles');
        }

        if (districtsRes.success && districtsRes.data) {
          setDistricts(districtsRes.data);
        } else {
          toast.error('Failed to load districts');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Server error while loading data');
      }
    };
    fetchData();
  }, []);

  // ─── 2. If editing, fetch staff details ───
  useEffect(() => {
    if (!id) return;

    const fetchStaff = async () => {
      setLoading(true);
      try {
        console.log(`🔍 Fetching staff with ID: ${id}`);
        const res = await getStaffAPI(id);
        console.log('📦 API response:', res);

        if (!res.success) {
          toast.error(res.message || 'Failed to load staff');
          router.push('/super-admin/staff');
          return;
        }

        let member = null;

        // 🔥 Handle BOTH cases: array or single object
        if (Array.isArray(res.data)) {
          // It's an array – find the staff with matching ID
          member = res.data.find(item => item._id === id);
          if (!member) {
            toast.error('Staff member not found');
            router.push('/super-admin/staff');
            return;
          }
        } else if (res.data && typeof res.data === 'object') {
          // It's a single object
          member = res.data;
        } else {
          toast.error('Invalid data format');
          router.push('/super-admin/staff');
          return;
        }

        console.log('👤 Found staff:', member);

        // Populate form with the found staff
        setFormData({
          name: member.fullName || '',
          email: member.email || '',
          phone: member.phone || '',
          role: member.role?.name || (roles.length > 0 ? roles[0] : ''),
          district: member.district || (districts.length > 0 ? districts[0] : ''),
          status: member.status || 'active',
          joinDate: member.joiningDate
            ? new Date(member.joiningDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          password: '',
          confirmPassword: '',
        });

      } catch (error) {
        console.error('❌ Error fetching staff:', error);
        toast.error('Server error while loading staff');
        router.push('/super-admin/staff');
      } finally {
        setLoading(false);
      }
    };

    // Wait for roles and districts to load first
    if (roles.length > 0 && districts.length > 0) {
      fetchStaff();
    }
  }, [id, roles, districts, router]);

  // ─── 3. Save ───
  const saveStaff = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.district) {
      toast.error('Name, email, phone, and district are required');
      return;
    }
    if (!id && !formData.password) {
      toast.error('Password is required for new staff');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        district: formData.district,
        status: formData.status,
        joiningDate: formData.joinDate,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      let response;
      if (id) {
        response = await updateStaffAPI(id, payload);
      } else {
        response = await createStaffAPI(payload);
      }

      if (response.success) {
        toast.success(id ? 'Staff updated successfully' : 'Staff added successfully');
        router.push('/super-admin/staff');
      } else {
        toast.error(response.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      toast.error('Server error while saving staff');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="add-edit-page">
        <div className="loading-spinner">Loading staff details...</div>
      </div>
    );
  }

  return (
    <div className="add-edit-page">
      <Toaster position="top-right" />

      <div className="add-edit-container">
        <div className="form-header">
          <h2>
            <i className="bi bi-person-plus"></i> {id ? 'Edit Staff' : 'Add Staff Member'}
          </h2>
          <button className="btn-secondary" onClick={() => router.push('/super-admin/staff')}>
            <i className="bi bi-arrow-left"></i> Back
          </button>
        </div>

        <div className="form-body">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="form-group">
              <label>Email <span className="required">*</span></label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone <span className="required">*</span></label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div className="form-group">
              <label>Role <span className="required">*</span></label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>District <span className="required">*</span></label>
              <select
                value={formData.district}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
              >
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Password {!id && <span className="required">*</span>}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder={id ? "Leave blank to keep current" : "Enter password"}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm password"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: "1 1 100%" }}>
              <label>Joining Date</label>
              <input
                type="date"
                value={formData.joinDate}
                onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button className="btn-secondary" onClick={() => router.push('/super-admin/staff')}>
            Cancel
          </button>
          <button className="btn-primary" onClick={saveStaff} disabled={saving}>
            {saving ? "Saving..." : id ? "Update Staff" : "Add Staff"}
          </button>
        </div>
      </div>
    </div>
  );
}