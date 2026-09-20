'use client';

import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './custom-label.css';

export default function CustomLabelPage() {
  // Permission toggle: 'all', 'inhouse', 'seller'
  const [permission, setPermission] = useState('all');
  
  // Sample labels data – changed "Added By" to "Adhimeds"
  const [labels, setLabels] = useState([
    { id: 1, label: 'Top Choice', addedBy: 'Adhimeds', sellerAccess: true },
    { id: 2, label: 'Free Shipping', addedBy: 'Adhimeds', sellerAccess: false },
  ]);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [editForm, setEditForm] = useState({ label: '', addedBy: '', sellerAccess: false });

  // Handle add button click – show alert instead of navigation
  const handleAddClick = () => {
    alert('This page will be added later');
  };

  // Open edit modal
  const openEditModal = (label) => {
    setEditingLabel(label);
    setEditForm({
      label: label.label,
      addedBy: label.addedBy,
      sellerAccess: label.sellerAccess,
    });
    setEditModalOpen(true);
  };

  // Save edit
  const saveEdit = () => {
    if (!editForm.label.trim()) {
      toast.error('Label name is required');
      return;
    }
    const updatedLabels = labels.map((l) =>
      l.id === editingLabel.id
        ? { ...l, label: editForm.label, addedBy: editForm.addedBy, sellerAccess: editForm.sellerAccess }
        : l
    );
    setLabels(updatedLabels);
    setEditModalOpen(false);
    toast.success('Label updated');
  };

  // Delete label
  const deleteLabel = (id) => {
    if (window.confirm('Are you sure you want to delete this label?')) {
      setLabels(labels.filter((l) => l.id !== id));
      toast.success('Label deleted');
    }
  };

  // Toggle seller access (inline toggle)
  const toggleSellerAccess = (id) => {
    setLabels(labels.map((l) => (l.id === id ? { ...l, sellerAccess: !l.sellerAccess } : l)));
    toast.success('Seller access updated');
  };

  return (
    <div className="custom-label-page">
      <Toaster position="top-right" />
      <div className="container-fluid py-4">
        
        {/* Header with title and Add button */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="page-title">Custom Label</h2>
          <button
            className="btn-add-custom-label"
            onClick={handleAddClick}
          >
            <i className="bi bi-plus-circle me-1"></i> Add New Custom Label
          </button>
        </div>

        {/* Permission Toggle */}
        <div className="form-card mb-4">
          <div className="card-header">Sellers Can Create Custom Label?</div>
          <div className="card-body">
            <div className="permission-toggle">
              <button
                className={`toggle-btn ${permission === 'all' ? 'active' : ''}`}
                onClick={() => setPermission('all')}
              >
                All
              </button>
              <button
                className={`toggle-btn ${permission === 'inhouse' ? 'active' : ''}`}
                onClick={() => setPermission('inhouse')}
              >
                In-House
              </button>
              <button
                className={`toggle-btn ${permission === 'seller' ? 'active' : ''}`}
                onClick={() => setPermission('seller')}
              >
                Seller
              </button>
            </div>
          </div>
        </div>

        {/* Labels Table */}
        <div className="form-card mb-4">
          <div className="card-header">Labels</div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="med-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Label</th>
                    <th>Added By</th>
                    <th>Seller Can Access?</th>
                    <th>Options</th>
                  </tr>
                </thead>
                <tbody>
                  {labels.map((label, idx) => (
                    <tr key={label.id}>
                      <td className="fw-semibold">{idx + 1}</td>
                      <td className="fw-semibold">{label.label}</td>
                      <td>{label.addedBy}</td>
                      <td>
                        <div className="toggle-switch-small">
                          <input
                            type="checkbox"
                            checked={label.sellerAccess}
                            onChange={() => toggleSellerAccess(label.id)}
                          />
                          <span className="toggle-slider-small"></span>
                        </div>
                      </td>
                      <td>
                        <div className="action-icons">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => openEditModal(label)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => deleteLabel(label.id)}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {labels.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        No labels found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">Edit Custom Label</h5>
              <button className="modal-close" onClick={() => setEditModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Label</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.label}
                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Added By</label>
                <select
                  className="form-select"
                  value={editForm.addedBy}
                  onChange={(e) => setEditForm({ ...editForm, addedBy: e.target.value })}
                >
                  <option value="Adhimeds">Adhimeds</option>
                  <option value="All">All</option>
                  <option value="In-House">In-House</option>
                  <option value="Seller">Seller</option>
                </select>
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="sellerAccessEdit"
                  checked={editForm.sellerAccess}
                  onChange={(e) => setEditForm({ ...editForm, sellerAccess: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="sellerAccessEdit">
                  Seller Can Access?
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={() => setEditModalOpen(false)}>Cancel</button>
              <button className="modal-btn-save" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}