"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { getStoresAPI, deleteStoreAPI, getStoreByIdAPI } from "../../services/storeManagementAPI";
import SERVERURL from "../../services/serverURL";
import { useTheme } from "@/context/ThemeContext";
import "./store-management.css";

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SERVERURL}${normalized}`;
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function StoreManagement() {
  const router = useRouter();
  const { theme } = useTheme();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewStore, setViewStore] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // ── Portal Dropdown state ──
  const [dropdownData, setDropdownData] = useState(null);
  const menuRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStoresAPI();
      if (res.success) setStores(res.data);
      else toast.error(res.message || "Failed to fetch stores");
    } catch {
      toast.error("Server error while fetching stores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const filteredStores = useMemo(() => {
    let result = stores;
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter(
        (s) =>
          s.storeName?.toLowerCase().includes(term) ||
          s.address?.toLowerCase().includes(term) ||
          s.district?.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== "All") {
      result = result.filter((s) => s.status.toLowerCase() === statusFilter.toLowerCase());
    }
    return result;
  }, [stores, debouncedSearch, statusFilter]);

  const totalFiltered = filteredStores.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStores = filteredStores.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

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

  const handleAdd = () => router.push("/super-admin/store-managment/add");
  const handleEdit = (id) => {
    router.push(`/super-admin/store-managment/edit/${id}`);
    setDropdownData(null);
  };
  const confirmDelete = (id) => {
    setDeleteConfirm(id);
    setDropdownData(null);
  };
  const deleteStore = async () => {
    setDeleting(true);
    try {
      const res = await deleteStoreAPI(deleteConfirm);
      if (res.success) {
        toast.success("Store deleted");
        fetchStores();
      } else {
        toast.error(res.message || "Delete failed");
      }
    } catch {
      toast.error("Server error while deleting");
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };
  const handleViewStore = async (id) => {
    setViewLoading(true);
    try {
      const res = await getStoreByIdAPI(id);
      if (res.success) setViewStore(res.data);
      else toast.error("Failed to load store details");
    } catch {
      toast.error("Error loading store details");
    } finally {
      setViewLoading(false);
    }
    setDropdownData(null);
  };

  // ─── Toggle portal dropdown – always below with max-height ───
  const toggleDropdown = (store, event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const menuWidth = 230;
    const menuHeight = 220; // approx height of dropdown

    let left = rect.right - menuWidth;
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    // Always place below, but with a max-height to fit viewport
    let top = rect.bottom + 6;
    // If it goes below viewport, adjust top to fit
    if (top + menuHeight > window.innerHeight) {
      top = window.innerHeight - menuHeight - 10;
    }
    // Clamp to never go off the top
    if (top < 10) top = 10;

    if (dropdownData && dropdownData.id === store._id) {
      setDropdownData(null);
    } else {
      setDropdownData({ id: store._id, top, left, store });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDropdownData(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getThemeClass = () => {
    if (theme === "dark") return "super-admin-wrapper dark";
    if (theme === "green") return "super-admin-wrapper green";
    return "super-admin-wrapper";
  };

  const renderDropdown = () => {
    if (!dropdownData || !isMounted) return null;
    const { id, store, top, left } = dropdownData;
    return createPortal(
      <div
        ref={menuRef}
        className={`portal-dropdown ${getThemeClass()}`}
        style={{
          position: "fixed",
          top: top,
          left: left,
          zIndex: 999999,
          width: 230,
        }}
      >
        <button className="menu-item" onClick={() => handleEdit(id)}>
          <i className="bi bi-pencil-square"></i> Edit Store
        </button>
        <button className="menu-item" onClick={() => handleViewStore(id)}>
          <i className="bi bi-eye"></i> View Store
        </button>
        <button className="menu-item delete" onClick={() => confirmDelete(id)}>
          <i className="bi bi-trash"></i> Delete Store
        </button>
      </div>,
      document.body
    );
  };

  const SkeletonRow = () => (
    <tr className="skeleton-row">
      <td><div className="skeleton" style={{ width: "30px" }} /></td>
      <td><div className="skeleton" style={{ width: "150px" }} /></td>
      <td><div className="skeleton" style={{ width: "100px" }} /></td>
      <td><div className="skeleton" style={{ width: "140px" }} /></td>
      <td><div className="skeleton" style={{ width: "120px" }} /></td>
      <td><div className="skeleton" style={{ width: "50px" }} /></td>
      <td><div className="skeleton" style={{ width: "80px" }} /></td>
      <td><div className="skeleton" style={{ width: "40px" }} /></td>
    </tr>
  );

  return (
    <div className="store-page">
      <Toaster position="top-right" />

      <div className="page-header">
        <h2>Store Management</h2>
        <button className="add-btn" onClick={handleAdd}>
          <i className="bi bi-plus-lg"></i> Add New Store
        </button>
      </div>

      <div className="store-card">
        <div className="store-topbar">
          <div className="store-tabs">
            {["All", "Active", "Inactive", "Pending"].map((tab) => (
              <button
                key={tab}
                className={statusFilter === tab ? "active" : ""}
                onClick={() => setStatusFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search store..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-outer">
          <div className="table-wrapper">
            {loading ? (
              <table className="store-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Store</th>
                    <th>Owner</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Products</th>
                    <th>Status</th>
                    <th className="text-center">Options</th>
                  </tr>
                </thead>
                <tbody>
                  {Array(itemsPerPage).fill(0).map((_, i) => <SkeletonRow key={i} />)}
                </tbody>
              </table>
            ) : (
              <>
                <table className="store-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Store</th>
                      <th>Owner</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Products</th>
                      <th>Status</th>
                      <th className="text-center">Options</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStores.map((store, idx) => {
                      const thumbnail = store.thumbnailImages?.[0] || store.logo;
                      return (
                        <tr key={store._id}>
                          <td>{startIndex + idx + 1}</td>
                          <td>
                            <div className="store-info">
                              {thumbnail && (
                                <img
                                  src={getImageUrl(thumbnail)}
                                  alt={store.storeName}
                                  className="store-logo"
                                  loading="lazy"
                                  onError={(e) => (e.target.style.display = "none")}
                                />
                              )}
                              <span>{store.storeName}</span>
                            </div>
                          </td>
                          <td>{store.owner || store.pharmacistName || "—"}</td>
                          <td>{store.emailAddress || "—"}</td>
                          <td>{store.contactNumber || "—"}</td>
                          <td>{store.products || 0}</td>
                          <td>
                            <span className={`status ${store.status?.toLowerCase() || "pending"}`}>
                              {store.status ? store.status.charAt(0).toUpperCase() + store.status.slice(1) : "—"}
                            </span>
                          </td>
                          <td className="text-center">
                            <button
                              className={`option-btn ${dropdownData && dropdownData.id === store._id ? "active" : ""}`}
                              onClick={(e) => toggleDropdown(store, e)}
                            >
                              <i className="bi bi-three-dots-vertical"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedStores.length === 0 && (
                      <tr>
                        <td colSpan="8" className="empty-state">
                          <i className="bi bi-inbox"></i>
                          <p>No stores found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {totalFiltered > 0 && (
                  <div className="table-footer">
                    <div className="table-info">
                      Showing {startItem} to {endItem} of {totalFiltered} stores
                    </div>
                    <div className="pagination">
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        {[10, 25, 50, 100].map((n) => (
                          <option key={n} value={n}>{n} per page</option>
                        ))}
                      </select>
                      <button className="page-btn" onClick={prevPage} disabled={currentPage === 1}>
                        ◀
                      </button>
                      {pageNumbers().map((p) => (
                        <button
                          key={p}
                          className={`page-btn ${currentPage === p ? "active" : ""}`}
                          onClick={() => goToPage(p)}
                        >
                          {p}
                        </button>
                      ))}
                      <button className="page-btn" onClick={nextPage} disabled={currentPage === totalPages}>
                        ▶
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Delete Modal ─── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="bi bi-exclamation-triangle-fill"></i> Confirm Delete</h3>
              <button className="close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this store? This cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={deleteStore} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── View Drawer ─── */}
      <AnimatePresence>
        {viewStore && (
          <>
            <div className="drawer-backdrop" onClick={() => setViewStore(null)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="view-drawer"
            >
              <div className="drawer-header">
                <h5>Store Details</h5>
                <button className="drawer-close" onClick={() => setViewStore(null)}>×</button>
              </div>
              <div className="drawer-body">
                {viewLoading ? (
                  <div className="loading-spinner">Loading...</div>
                ) : (
                  <>
                    {viewStore.thumbnailImages?.length > 0 && (
                      <div className="drawer-image-gallery">
                        {viewStore.thumbnailImages.map((img, i) => (
                          <img
                            key={i}
                            src={getImageUrl(img)}
                            alt={`thumb-${i}`}
                            className="drawer-thumb"
                            loading="lazy"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        ))}
                      </div>
                    )}
                    <div className="detail-row"><strong>Store Name:</strong> {viewStore.storeName}</div>
                    <div className="detail-row"><strong>Owner:</strong> {viewStore.owner || viewStore.pharmacistName || "—"}</div>
                    <div className="detail-row"><strong>Email:</strong> {viewStore.emailAddress || "—"}</div>
                    <div className="detail-row"><strong>Phone:</strong> {viewStore.contactNumber || "—"}</div>
                    <div className="detail-row"><strong>Address:</strong> {viewStore.address || "—"}</div>
                    <div className="detail-row"><strong>District:</strong> {viewStore.district || "—"}</div>
                    <div className="detail-row"><strong>Status:</strong> <span className={`status ${viewStore.status?.toLowerCase() || "pending"}`}>{viewStore.status?.toUpperCase() || "—"}</span></div>
                    <div className="detail-row"><strong>Added on:</strong> {viewStore.createdAt ? new Date(viewStore.createdAt).toLocaleDateString() : "N/A"}</div>
                  </>
                )}
              </div>
              <div className="drawer-footer">
                <button className="btn-secondary" onClick={() => setViewStore(null)}>Close</button>
                <button className="btn-primary" onClick={() => { router.push(`/super-admin/store-managment/edit/${viewStore._id}`); setViewStore(null); }}>
                  Edit Store
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Portal Dropdown ─── */}
      {renderDropdown()}
    </div>
  );
}