'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { getNotesAPI, deleteNoteAPI } from '../../../../services/noteAPI';
import './notes-dashboard.css';   // separate CSS

export default function NotesDashboardPage() {
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const noteTypes = ['Shipping', 'Refund', 'Warranty', 'Delivery', 'Medical Advice', 'Prescription', 'Lab Result'];

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotesAPI();   // ✅ use getNotesAPI (no ID)
      if (res.success) {
        setNotes(res.data);
      } else {
        toast.error(res.message || 'Failed to load notes');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error while loading notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    setDeletingId(id);
    try {
      const res = await deleteNoteAPI(id);
      if (res.success) {
        toast.success('Note deleted successfully');
        fetchNotes();
      } else {
        toast.error(res.message || 'Delete failed');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          note.type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || note.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="notes-dashboard">
      <Toaster position="top-right" />
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <h2 className="page-title">Notes Management</h2>
          <button
            className="btn-add-note"
            onClick={() => router.push('/super-admin/product-managment/product-setup/notes/addNote')}
          >
            <i className="bi bi-plus-circle me-1"></i> Add New Note
          </button>
        </div>

        {/* Filters */}
        <div className="filter-bar mb-4">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by type or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Filter by Type</label>
              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                {noteTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn-reset w-100"
                onClick={() => { setSearchTerm(''); setTypeFilter('all'); }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Notes Table */}
        <div className="form-card">
          <div className="card-header">All Notes</div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="med-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>User</th>
                    <th>Seller Can Access</th>
                    <th>Options</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" className="text-center py-5"><div className="spinner-border text-primary" /></td></tr>
                  ) : filteredNotes.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-4 text-muted">No notes found.</td></tr>
                  ) : (
                    filteredNotes.map((note, idx) => (
                      <tr key={note._id}>
                        <td className="fw-semibold">{idx + 1}</td>
                        <td><span className="badge-type">{note.type}</span></td>
                        <td>{note.description.length > 100 ? note.description.substring(0, 100) + '...' : note.description}</td>
                        <td>{note.user || 'In-House'}</td>
                        <td>
                          {note.sellerCanAccess ? (
                            <i className="bi bi-check-circle-fill text-success"></i>
                          ) : (
                            <i className="bi bi-x-circle-fill text-danger"></i>
                          )}
                        </td>
                        <td>
                          <div className="action-icons">
                           <Link
  href={`/super-admin/product-managment/product-setup/notes/addNote?id=${note._id}`}
  className="action-btn edit-btn"
  title="Edit"
>
  <i className="bi bi-pencil"></i>
</Link>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDelete(note._id)}
                              disabled={deletingId === note._id}
                              title="Delete"
                            >
                              {deletingId === note._id ? (
                                <span className="spinner-border spinner-border-sm" style={{ width: '1rem', height: '1rem' }}></span>
                              ) : (
                                <i className="bi bi-trash"></i>
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
        </div>
      </div>
    </div>
  );
}