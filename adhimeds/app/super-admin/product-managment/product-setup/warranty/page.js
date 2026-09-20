"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./warranty.css";
import {
  createWarrantyAPI,
  deleteWarrantyAPI,
  getWarrantiesAPI,
  updateWarrantyAPI,
} from "../../../../services/warrentyAPI";
import SERVERURL from "../../../../services/serverURL";

export default function WarrantyPage() {
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenu, setOpenMenu] = useState(null);

  // ── Pagination state ──
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // ── Sidebar state ──
  const [showSidebar, setShowSidebar] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentWarranty, setCurrentWarranty] = useState(null);
  const [warrantyText, setWarrantyText] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const previewUrlRef = useRef(null);

  // ── Helpers ──
  const getLogoUrl = (logo) => {
    if (!logo) return null;
    if (logo.startsWith("data:")) return logo;
    if (logo.startsWith("http")) return logo;
    return `${SERVERURL}/${logo}`;
  };

  const fetchWarranties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWarrantiesAPI();
      if (res.success) {
        setWarranties(res.data);
        setTotalItems(res.data.length);
      } else {
        toast.error(res.message || "Failed to load warranties");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarranties();
  }, [fetchWarranties]);

  // ── Cleanup object URLs ──
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  // ── Filtered and paginated list ──
  const filteredWarranties = warranties.filter((w) =>
    w.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalFiltered = filteredWarranties.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWarranties = filteredWarranties.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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

  const resetForm = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setWarrantyText("");
    setLogoFile(null);
    setLogoPreview(null);
    setIsEditMode(false);
    setCurrentWarranty(null);
  };

  const openAddSidebar = () => {
    resetForm();
    setShowSidebar(true);
  };

  const openEditSidebar = (warranty) => {
    resetForm();
    setIsEditMode(true);
    setCurrentWarranty(warranty);
    setWarrantyText(warranty.text);
    const logoUrl = getLogoUrl(warranty.logo);
    setLogoPreview(logoUrl);
    setLogoFile(null);
    setShowSidebar(true);
    setOpenMenu(null);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
    resetForm();
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    setLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setLogoPreview(previewUrl);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this warranty permanently?")) return;
    try {
      const res = await deleteWarrantyAPI(id);
      if (res.success) {
        toast.success("Warranty deleted");
        fetchWarranties();
        setOpenMenu(null);
      } else {
        toast.error(res.message || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  };

  const saveWarranty = async () => {
    if (!warrantyText.trim()) {
      toast.warn("Please enter warranty text");
      return;
    }

    setIsSaving(true);
    try {
      let response;
      const text = warrantyText.trim();
      if (isEditMode) {
        if (logoFile) {
          const fd = new FormData();
          fd.append("text", text);
          fd.append("logo", logoFile);
          response = await updateWarrantyAPI(currentWarranty._id, fd);
        } else {
          response = await updateWarrantyAPI(currentWarranty._id, { text });
        }
      } else {
        if (logoFile) {
          const fd = new FormData();
          fd.append("text", text);
          fd.append("logo", logoFile);
          response = await createWarrantyAPI(fd);
        } else {
          response = await createWarrantyAPI({ text, logo: null });
        }
      }
      if (response.success) {
        toast.success(isEditMode ? "Updated" : "Created");
        await fetchWarranties();
        closeSidebar();
      } else {
        toast.error(response.message || "Operation failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Click outside to close dropdown ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown-wrapper")) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const startItem = totalFiltered === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(startIndex + itemsPerPage, totalFiltered);

  return (
    <div className="warranty-page">
      <ToastContainer position="top-right" autoClose={3000} />

      <h3 className="page-title">All Warranties</h3>

      <div className="warranty-card">
        {/* Top Header */}
        <div className="card-header-area">
          <div className="header-left">
            <button className="tab-btn active">All Warranties</button>
          </div>
          <div className="header-right">
            <button className="add-btn" onClick={openAddSidebar}>
              Add New Warranty
            </button>
            <button className="plus-btn" onClick={openAddSidebar}>
              <i className="bi bi-plus-lg"></i>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search Warranties ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="bulk-action">
            <option>Bulk Action</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-responsive">
          {loading ? (
            <div className="loading-state">Loading warranties...</div>
          ) : (
            <>
              <table className="table warranty-table align-middle">
                <thead>
                  <tr>
                    <th width="60">
                      <input type="checkbox" />
                    </th>
                    <th>WARRANTY TEXT</th>
                    <th className="text-center">LOGO</th>
                    <th className="text-end">OPTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedWarranties.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <input type="checkbox" />
                      </td>
                      <td className="warranty-name">{item.text}</td>
                      <td className="text-center">
                        {item.logo ? (
                          <img
                            src={getLogoUrl(item.logo)}
                            alt={item.text}
                            className="warranty-logo circle-logo"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="dropdown-wrapper">
                          <button
                            className={`option-btn ${openMenu === item._id ? "active" : ""}`}
                            onClick={() =>
                              setOpenMenu(openMenu === item._id ? null : item._id)
                            }
                          >
                            <i className="bi bi-three-dots-vertical"></i>
                          </button>
                          {openMenu === item._id && (
                            <div className="option-menu">
                              <button
                                className="menu-item"
                                onClick={() => openEditSidebar(item)}
                              >
                                <i className="bi bi-pencil-square"></i> Edit
                              </button>
                              <button
                                className="menu-item delete"
                                onClick={() => handleDelete(item._id)}
                              >
                                <i className="bi bi-trash"></i> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedWarranties.length === 0 && !loading && (
                    <tr>
                      <td colSpan="4" className="empty-state">
                        <p>No warranties found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* ─── Pagination ─── */}
              {totalFiltered > 0 && (
                <div className="pagination-wrapper">
                  <div className="pagination-info">
                    Showing {startItem} to {endItem} of {totalFiltered} warranties
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
                      {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n} per page
                        </option>
                      ))}
                    </select>
                    <nav>
                      <ul className="pagination-list">
                        <li className={currentPage === 1 ? "hidden" : ""}>
                          <button
                            onClick={prevPage}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                          >
                            ◀
                          </button>
                        </li>
                        {pageNumbers().map((p) => (
                          <li key={p}>
                            <button
                              onClick={() => goToPage(p)}
                              className={`pagination-btn ${currentPage === p ? "active" : ""}`}
                            >
                              {p}
                            </button>
                          </li>
                        ))}
                        <li className={currentPage === totalPages ? "hidden" : ""}>
                          <button
                            onClick={nextPage}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                          >
                            ▶
                          </button>
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

      {/* ─── Sidebar (Offcanvas) ─── */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <div className="sidebar-overlay" onClick={closeSidebar} />
            <motion.div
              className="warranty-sidebar"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            >
              <div className="sidebar-header">
                <h5>{isEditMode ? "Edit Warranty" : "Add New Warranty"}</h5>
                <button className="sidebar-close" onClick={closeSidebar}>
                  ×
                </button>
              </div>
              <div className="sidebar-body">
                <div className="form-group">
                  <label>
                    Warranty Text <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={warrantyText}
                    onChange={(e) => setWarrantyText(e.target.value)}
                    placeholder="e.g., 1 Year, Lifetime, 5 Years"
                  />
                </div>
                <div className="form-group">
                  <label>Logo (40x40)</label>
                  <div className="file-upload-wrapper">
                    <input
                      type="file"
                      className="file-input"
                      accept="image/*"
                      onChange={handleLogoChange}
                      id="logo-upload-sidebar"
                    />
                    <label htmlFor="logo-upload-sidebar" className="file-label">
                      <i className="bi bi-cloud-upload"></i> Browse
                    </label>
                    <span className="file-name">
                      {logoFile ? logoFile.name : "Choose File"}
                    </span>
                  </div>
                  <small className="text-muted">
                    Minimum dimensions required: 40px width × 40px height.
                  </small>
                  {logoPreview && (
                    <div className="logo-preview-wrapper">
                      <img
                        src={logoPreview}
                        alt="preview"
                        className="logo-preview circle-logo-preview"
                      />
                      <button
                        className="remove-preview"
                        onClick={() => {
                          if (previewUrlRef.current) {
                            URL.revokeObjectURL(previewUrlRef.current);
                            previewUrlRef.current = null;
                          }
                          setLogoPreview(null);
                          setLogoFile(null);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="sidebar-footer">
                <button className="btn-cancel" onClick={closeSidebar}>
                  Cancel
                </button>
                <button
                  className="btn-save"
                  onClick={saveWarranty}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving...
                    </>
                  ) : (
                    <>{isEditMode ? "Update" : "Confirm"}</>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}