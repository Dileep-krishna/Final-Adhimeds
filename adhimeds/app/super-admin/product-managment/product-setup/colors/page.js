'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { createColorAPI, deleteColorAPI, getColorsAPI, updateColorAPI } from '../../../../services/colorAPI';
import './colors.css'; // ✅ Import theme-aware CSS

export default function ColorsPage() {
  const router = useRouter();
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '#000000' });
  const [saving, setSaving] = useState(false);
  const [filterEnabled, setFilterEnabled] = useState(false);

  const fetchColors = async () => {
    setLoading(true);
    try {
      const res = await getColorsAPI();
      if (res.success) {
        setColors(res.data);
      } else {
        toast.error(res.message || 'Failed to load colors');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  const openAddModal = () => {
    setIsEdit(false);
    setSelectedColor(null);
    setFormData({ name: '', code: '#000000' });
    setShowModal(true);
  };

  const openEditModal = (color) => {
    setIsEdit(true);
    setSelectedColor(color);
    setFormData({ name: color.name, code: color.code || '#000000' });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Color name is required');
      return;
    }
    if (!formData.code.trim()) {
      toast.error('Color code is required');
      return;
    }

    setSaving(true);
    try {
      let res;
      if (isEdit) {
        res = await updateColorAPI(selectedColor._id, formData);
      } else {
        res = await createColorAPI(formData);
      }
      if (res.success) {
        toast.success(isEdit ? 'Color updated' : 'Color created');
        fetchColors();
        setShowModal(false);
      } else {
        toast.error(res.message || 'Operation failed');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this color permanently?')) return;
    try {
      const res = await deleteColorAPI(id);
      if (res.success) {
        toast.success('Color deleted');
        fetchColors();
      } else {
        toast.error(res.message || 'Delete failed');
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  return (
    <div className="colors-page-container">
      <Toaster position="top-right" />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h3 mb-0">
          <i className="bi bi-palette me-2" style={{ color: 'var(--accent)' }}></i>
          All Colors
        </h2>
        <button className="btn btn-success" onClick={openAddModal}>
          <i className="bi bi-plus-circle me-1"></i> Add New Color
        </button>
      </div>

      {/* Filter Toggle Card */}
      <div className="card mb-4">
        <div className="card-body d-flex justify-content-between align-items-center">
          <div>
            <i className="bi bi-funnel me-2" style={{ color: 'var(--text-secondary)' }}></i>
            <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>
              Activate Color Filter for Product Listing Page
            </span>
          </div>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="colorFilterSwitch"
              checked={filterEnabled}
              onChange={(e) => setFilterEnabled(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="colorFilterSwitch" style={{ color: 'var(--text-primary)' }}>
              {filterEnabled ? 'ON' : 'OFF'}
            </label>
          </div>
        </div>
      </div>

      {/* Colors Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status"></div>
              <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Loading colors...</p>
            </div>
          ) : colors.length === 0 ? (
            <div className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
              <i className="bi bi-palette fs-1" style={{ color: 'var(--text-secondary)' }}></i>
              <p className="mt-2">No colors added yet. Click "Add New Color" to start.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Color Code</th>
                    <th>Options</th>
                  </tr>
                </thead>
                <tbody>
                  {colors.map((color) => (
                    <tr key={color._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              backgroundColor: color.code || '#cccccc',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                            }}
                          ></div>
                          <span style={{ color: 'var(--text-primary)' }}>{color.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-primary)' }}>
                        <code>{color.code || '—'}</code>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => openEditModal(color)}
                        >
                          <i className="bi bi-pencil"></i> Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(color._id)}
                        >
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowModal(false)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ color: 'var(--text-primary)' }}>
                  <i className="bi bi-palette me-2" style={{ color: 'var(--accent)' }}></i>
                  {isEdit ? 'Edit Color' : 'Color Information'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., MistyRose, Ivory"
                    autoFocus
                  />
                  <small className="text-muted">Type color name & Enter (optional)</small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Color Code *</label>
                  <div className="d-flex gap-2 align-items-center">
                    <input
                      type="color"
                      className="form-control form-control-color"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      style={{ width: '60px', height: '38px' }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      placeholder="#RRGGBB"
                    />
                  </div>
                  <small className="text-muted">Hex color code, e.g., #FFE4E1</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-success" onClick={handleSubmit} disabled={saving}>
                  {saving ? 'Saving...' : isEdit ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}