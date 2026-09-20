'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import './staff.css';
import { getAllRoles } from '@/app/services/permissionService';
import { deleteStaffAPI, getStaffAPI, updateStaffAPI } from '@/app/services/staffService';

export default function StaffManagement() {
  const router = useRouter();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // ── Pagination ──
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ── View / Delete ──
  const [viewingStaff, setViewingStaff] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // ── Dropdown state (per row) ──
  const [dropdownOpenId, setDropdownOpenId] = useState(null);

  // ── Fetch roles ──
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await getAllRoles();
        if (res.success && res.data) {
          setRoles(res.data.map(r => r.name));
        } else {
          toast.error('Failed to load roles');
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast.error('Server error while loading roles');
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, []);

  // ── Fetch staff ──
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getStaffAPI();
      if (response.success) {
        setStaff(response.data);
      } else {
        toast.error(response.message || 'Failed to load staff');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Server error while loading staff');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // ── Filtering ──
  const filteredStaff = useMemo(() => {
    let result = staff;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(member =>
        member.fullName.toLowerCase().includes(term) ||
        member.email.toLowerCase().includes(term) ||
        (member.role?.name || '').toLowerCase().includes(term) ||
        (member.district || '').toLowerCase().includes(term)
      );
    }
    if (roleFilter !== 'all') {
      result = result.filter(member => member.role?.name === roleFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(member => member.status === statusFilter);
    }
    return result;
  }, [staff, searchTerm, roleFilter, statusFilter]);

  // ── Pagination ──
  const totalFiltered = filteredStaff.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStaff = filteredStaff.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  const pageNumbers = () => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const startItem = totalFiltered === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(startIndex + itemsPerPage, totalFiltered);

  // ── Stats ──
  const totalStaff = staff.length;
  const activeStaff = staff.filter(s => s.status === 'active').length;
  const totalRoles = new Set(staff.map(s => s.role?.name)).size;
  const totalDistricts = new Set(staff.map(s => s.district).filter(Boolean)).size;

  // ── Handlers ──
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff member permanently?')) return;
    setDeleting(true);
    try {
      const response = await deleteStaffAPI(id);
      if (response.success) {
        toast.success('Staff deleted successfully');
        fetchStaff();
      } else {
        toast.error(response.message || 'Deletion failed');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Server error while deleting staff');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
      setDropdownOpenId(null);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const response = await updateStaffAPI(id, { status: newStatus });
      if (response.success) {
        toast.success(`Staff marked as ${newStatus}`);
        fetchStaff();
      } else {
        toast.error(response.message || 'Status update failed');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Server error while updating status');
    }
    setDropdownOpenId(null);
  };

  // ─── Dropdown toggle ────────────────────────────────────
  const toggleDropdown = (id) => {
    setDropdownOpenId(dropdownOpenId === id ? null : id);
  };

  // ─── Click outside to close dropdown ────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.options-wrapper')) {
        setDropdownOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Skeleton row ───
  const SkeletonRow = () => (
    <tr className="skeleton-row">
      <td><div className="skeleton" style={{ width: '30px' }} /></td>
      <td><div className="skeleton" style={{ width: '150px' }} /></td>
      <td><div className="skeleton" style={{ width: '140px' }} /></td>
      <td><div className="skeleton" style={{ width: '100px' }} /></td>
      <td><div className="skeleton" style={{ width: '100px' }} /></td>
      <td><div className="skeleton" style={{ width: '40px' }} /></td>
    </tr>
  );

  if (loadingRoles) return <div className="staff-page"><div className="loading-spinner">Loading...</div></div>;

  return (
    <div className="staff-page">
      <Toaster position="top-right" />

      {/* ─── Page Header ─── */}
      <div className="page-header">
        <h2>All Staff</h2>
        <button className="add-btn" onClick={() => router.push('/super-admin/staff/add')}>
          <i className="bi bi-plus-lg"></i> Add New Staff
        </button>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon"><i className="bi bi-people-fill"></i></div>
          <div>
            <span className="stat-value">{totalStaff}</span>
            <span className="stat-label">Total Staff</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="bi bi-check-circle-fill"></i></div>
          <div>
            <span className="stat-value">{activeStaff}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="bi bi-briefcase-fill"></i></div>
          <div>
            <span className="stat-value">{totalRoles}</span>
            <span className="stat-label">Roles</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="bi bi-geo-alt-fill"></i></div>
          <div>
            <span className="stat-value">{totalDistricts}</span>
            <span className="stat-label">Districts</span>
          </div>
        </div>
      </div>

      {/* ─── Filter Bar ─── */}
      <div className="filter-bar">
        <div className="search-group">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search by name, email, role or district..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label><i className="bi bi-briefcase"></i> Role</label>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label><i className="bi bi-flag"></i> Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="staff-card">
        <div className="card-header">
          <h4>Staff Members</h4>
        </div>
        <div className="table-responsive">
          {loading ? (
            <table className="table staff-table">
              <thead>
                <tr>
                  <th width="60">#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th className="text-end">Options</th>
                </tr>
              </thead>
              <tbody>
                {Array(itemsPerPage).fill(0).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          ) : (
            <>
              <table className="table staff-table">
                <thead>
                  <tr>
                    <th width="60">#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th className="text-end">Options</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStaff.map((member, idx) => (
                    <tr key={member._id}>
                      <td>{startIndex + idx + 1}</td>
                      <td>
                        <div className="staff-name-cell">
                          <span className="staff-avatar-sm">
                            {member.fullName.charAt(0)}{member.fullName.split(' ')[1]?.charAt(0) || ''}
                          </span>
                          <span>{member.fullName}</span>
                        </div>
                      </td>
                      <td>{member.email}</td>
                      <td>{member.phone}</td>
                      <td><span className="role-badge">{member.role?.name}</span></td>
                      <td className="text-end">
                        <div className="options-wrapper">
                          <button
                            className="options-toggle-btn"
                            onClick={() => toggleDropdown(member._id)}
                          >
                            <i className="bi bi-three-dots-vertical"></i>
                          </button>
                          {dropdownOpenId === member._id && (
                            <ul className="options-dropdown open">
                              <li>
                                <button className="dropdown-option-btn" onClick={() => { setViewingStaff(member); setDropdownOpenId(null); }}>
                                  <i className="bi bi-eye option-icon"></i> View
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-option-btn" onClick={() => { router.push(`/super-admin/staff/edit/${member._id}`); setDropdownOpenId(null); }}>
                                  <i className="bi bi-pencil option-icon"></i> Edit
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-option-btn" onClick={() => { toggleStatus(member._id, member.status); setDropdownOpenId(null); }}>
                                  <i className={`bi ${member.status === 'active' ? 'bi-toggle-on' : 'bi-toggle-off'} option-icon`}></i>
                                  {member.status === 'active' ? 'Deactivate' : 'Activate'}
                                </button>
                              </li>
                              <li className="dropdown-divider"></li>
                              <li>
                                <button className="dropdown-option-btn delete-option" onClick={() => { setDeleteConfirm(member._id); setDropdownOpenId(null); }}>
                                  <i className="bi bi-trash option-icon"></i> Delete
                                </button>
                              </li>
                            </ul>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedStaff.length === 0 && (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        <div className="empty-box">
                          <i className="bi bi-emoji-frown"></i>
                          <h3>Nothing found</h3>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* ─── Pagination ─── */}
              {totalFiltered > 0 && (
                <div className="pagination-wrapper">
                  <div className="pagination-info">
                    Showing {startItem} to {endItem} of {totalFiltered} staff
                  </div>
                  <div className="pagination-controls">
                    <select
                      className="pagination-select"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} per page</option>)}
                    </select>
                    <nav>
                      <ul className="pagination-list">
                        <li className={currentPage === 1 ? 'hidden' : ''}>
                          <button onClick={prevPage} disabled={currentPage === 1} className="pagination-btn">◀</button>
                        </li>
                        {pageNumbers().map(p => (
                          <li key={p}>
                            <button
                              onClick={() => goToPage(p)}
                              className={`pagination-btn ${currentPage === p ? 'active' : ''}`}
                            >
                              {p}
                            </button>
                          </li>
                        ))}
                        <li className={currentPage === totalPages ? 'hidden' : ''}>
                          <button onClick={nextPage} disabled={currentPage === totalPages} className="pagination-btn">▶</button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── View Modal ─── */}
      {viewingStaff && (
        <div className="modal-overlay" onClick={() => setViewingStaff(null)}>
          <div className="modal-content view-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="bi bi-person-circle"></i> Staff Details</h3>
              <button className="close" onClick={() => setViewingStaff(null)}>&times;</button>
            </div>
            <div className="modal-body view-body">
              <div className="detail-row"><span>Name:</span><strong>{viewingStaff.fullName}</strong></div>
              <div className="detail-row"><span>Role:</span><strong>{viewingStaff.role?.name}</strong></div>
              <div className="detail-row"><span>Email:</span><strong>{viewingStaff.email}</strong></div>
              <div className="detail-row"><span>Phone:</span><strong>{viewingStaff.phone}</strong></div>
              <div className="detail-row"><span>District:</span><strong>{viewingStaff.district || 'N/A'}</strong></div>
              <div className="detail-row"><span>Status:</span><span className={`status-badge ${viewingStaff.status}`}>{viewingStaff.status}</span></div>
              <div className="detail-row"><span>Joined:</span><strong>{viewingStaff.joiningDate ? new Date(viewingStaff.joiningDate).toLocaleDateString() : 'N/A'}</strong></div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewingStaff(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation ─── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="bi bi-exclamation-triangle"></i> Confirm Delete</h3>
              <button className="close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this staff member? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}