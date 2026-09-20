"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import "./brand.css";
import { getAllBrands, deleteBrand } from "../../../../services/brandAPI";
import SERVERURL from "../../../../services/serverURL";

export default function Page() {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState(null);

  // ── State ──
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);

  // ── Pagination state ──
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ── Click outside for dropdown ──
  useEffect(() => {
    function handleClick(e) {
      const target = e.target;
      if (target.closest('.option-menu') || target.closest('.option-btn')) {
        return;
      }
      setOpenMenu(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Fetch brands (with pagination, search & filter) ──
  const fetchBrands = useCallback(async (page = 1, limit = 10, search = "", filter = "all") => {
    setLoading(true);
    try {
      const res = await getAllBrands(page, limit, search, filter);
      if (res && res.success && Array.isArray(res.data)) {
        setBrands(res.data);
        setTotalItems(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } else if (res && Array.isArray(res.data)) {
        setBrands(res.data);
        setTotalItems(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } else {
        toast.error(res?.message || "Failed to load brands");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error while loading brands");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial fetch ──
  useEffect(() => {
    const filter = activeTab === "unused" ? "unused" : "all";
    fetchBrands(currentPage, itemsPerPage, searchTerm, filter);
  }, [currentPage, itemsPerPage, searchTerm, activeTab]);

  // ── Helpers ──
  const getImageUrl = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith("http")) return logoPath;
    return `${SERVERURL}${logoPath}`;
  };

  // ── Handlers ──
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this brand permanently?")) return;
    try {
      const res = await deleteBrand(id);
      if (res.success) {
        toast.success("Brand deleted successfully");
        const filter = activeTab === "unused" ? "unused" : "all";
        fetchBrands(currentPage, itemsPerPage, searchTerm, filter);
        setOpenMenu(null);
      } else {
        toast.error(res.message || "Delete failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error while deleting brand");
    }
  };

  const handleView = (brand) => {
    setSelectedBrand(brand);
    setShowOffcanvas(true);
    setOpenMenu(null);
  };

  const handleEdit = (id) => {
    router.push(`/super-admin/product-managment/product-setup/Brand/edit/${id}`);
    setOpenMenu(null);
  };

  const handleAdd = () => {
    router.push("/super-admin/product-managment/product-setup/Brand/addBrand");
  };

  const closeOffcanvas = () => {
    setShowOffcanvas(false);
    setSelectedBrand(null);
  };

  // ── Pagination controls ──
  const goToPage = (page) => setCurrentPage(page);
  const nextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages));
  const prevPage = () => setCurrentPage(p => Math.max(p - 1, 1));

  const pageNumbers = () => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // ── Loading state ──
  if (loading && brands.length === 0) {
    return (
      <div className="brands-page">
        <div className="loading-spinner">Loading brands...</div>
      </div>
    );
  }

  return (
    <div className="brands-page">
      <Toaster position="top-right" />

      <h3 className="page-title">All Brands</h3>

      <div className="brands-card">
        {/* Header */}
        <div className="brands-header">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Brands
            </button>
            <button
              className={`tab ${activeTab === "unused" ? "active" : ""}`}
              onClick={() => setActiveTab("unused")}
            >
              Unused Brands
            </button>
          </div>

          <div className="header-right">
            <button className="add-btn" onClick={handleAdd}>
              Add New Brand
            </button>
            <button className="circle-btn" onClick={handleAdd}>
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
              placeholder="Search Brands ..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <select className="bulk-select" defaultValue="">
            <option value="">Bulk Action</option>
            <option value="delete">Delete Selected</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table align-middle brand-table">
            <thead>
              <tr>
                <th width="50">
                  <input type="checkbox" />
                </th>
                <th>LOGO</th>
                <th>NAME</th>
                <th>QTY PRODUCTS</th>
                <th>CREATED</th>
                <th>CATEGORIES</th>
                <th className="text-end">OPTIONS</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand._id}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td>
                    {brand.logo ? (
                      <img
                        src={getImageUrl(brand.logo)}
                        className="brand-logo"
                        alt={brand.name}
                      />
                    ) : (
                      <div className="brand-logo-placeholder">
                        <i className="bi bi-building"></i>
                      </div>
                    )}
                  </td>
                  <td className="brand-name">{brand.name}</td>
                  <td>{brand.products || 0}</td>
                  <td>
                    {brand.createdAt
                      ? new Date(brand.createdAt).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </td>
                  <td>
                    <div>{brand.category || "General"}</div>
                  </td>
                  <td className="text-end">
                    <div className="option-wrapper">
                      <button
                        className={`option-btn ${openMenu === brand._id ? "active" : ""}`}
                        onClick={() =>
                          setOpenMenu(openMenu === brand._id ? null : brand._id)
                        }
                      >
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>

                      {openMenu === brand._id && (
                        <div className="option-menu">
                          <button
                            className="menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(brand);
                            }}
                          >
                            <i className="bi bi-eye"></i> View
                          </button>
                          <button
                            className="menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(brand._id);
                            }}
                          >
                            <i className="bi bi-pencil-square"></i> Edit
                          </button>
                          <button
                            className="menu-item delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(brand._id);
                            }}
                          >
                            <i className="bi bi-trash"></i> Delete
                          </button>
                          <button
                            className="menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/super-admin/product-managment/products/all-product?brand=${brand._id}`);
                              setOpenMenu(null);
                            }}
                          >
                            <i className="bi bi-box-seam"></i> View Products
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {brands.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No brands found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ─── Pagination ─── */}
          {totalItems > 0 && (
            <div className="pagination-wrapper">
              <div className="pagination-info">
                Showing {startItem} to {endItem} of {totalItems} brands
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
                    <option key={n} value={n}>{n} per page</option>
                  ))}
                </select>
                <nav>
                  <ul className="pagination-list">
                    <li className={currentPage === 1 ? "hidden" : ""}>
                      <button onClick={prevPage} disabled={currentPage === 1} className="pagination-btn">
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
                      <button onClick={nextPage} disabled={currentPage === totalPages} className="pagination-btn">
                        ▶
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Offcanvas Sidebar ─── */}
      <div
        className={`offcanvas offcanvas-end ${showOffcanvas ? "show" : ""}`}
        tabIndex="-1"
        style={{ visibility: showOffcanvas ? "visible" : "hidden" }}
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">
            <i className="bi bi-building me-2"></i>Brand Details
          </h5>
          <button
            type="button"
            className="btn-close"
            onClick={closeOffcanvas}
          ></button>
        </div>
        <div className="offcanvas-body">
          {selectedBrand && (
            <div className="brand-details">
              <div className="text-center mb-4">
                {selectedBrand.logo ? (
                  <img
                    src={getImageUrl(selectedBrand.logo)}
                    alt={selectedBrand.name}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "12px",
                    }}
                  />
                ) : (
                  <div className="logo-placeholder-large">
                    <i className="bi bi-building fs-1"></i>
                  </div>
                )}
              </div>
              <div className="detail-row">
                <span className="detail-label">Brand Name:</span>
                <span className="detail-value">{selectedBrand.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Category:</span>
                <span className="detail-value">
                  {selectedBrand.category || "General"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Products Count:</span>
                <span className="detail-value">{selectedBrand.products || 0}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Created At:</span>
                <span className="detail-value">
                  {selectedBrand.createdAt
                    ? new Date(selectedBrand.createdAt).toLocaleDateString(
                        "en-US",
                        { day: "numeric", month: "long", year: "numeric" }
                      )
                    : "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Meta Title:</span>
                <span className="detail-value">
                  {selectedBrand.metaTitle || "Not set"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Meta Description:</span>
                <span className="detail-value">
                  {selectedBrand.metaDescription || "Not set"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Meta Keywords:</span>
                <span className="detail-value">
                  {selectedBrand.metaKeywords || "Not set"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      {showOffcanvas && (
        <div className="offcanvas-backdrop" onClick={closeOffcanvas}></div>
      )}
    </div>
  );
}