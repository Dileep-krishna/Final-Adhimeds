"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import "./categories.css";
import {
  getCategoriesAPI,
  deleteCategoryAPI,
  updateCategoryAPI,
} from "@/app/services/categoryAPI";
import SERVERURL from "@/app/services/serverURL";

export default function CategoriesPage() {
  const router = useRouter();

  // State
  const [menuOpen, setMenuOpen] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10);

  // Helper functions
  const getImageUrl = useCallback((filename) => {
    if (!filename) return null;
    return `${SERVERURL}/imgUploads/${filename}`;
  }, []);

  const getParentName = useCallback((cat) => {
    if (!cat.parent) return "—";
    if (typeof cat.parent === "string") {
      const found = categories.find(c => c._id === cat.parent);
      return found ? found.name : "—";
    }
    return cat.parent.name || "—";
  }, [categories]);

  const getCategoryLevel = useCallback((cat) => {
    return cat.parent ? 1 : 0;
  }, []);

  // Fetch categories with pagination
  const fetchCategories = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getCategoriesAPI(page, limit, "");
      const { data, total, totalPages: pages } = res;
      setCategories(data || []);
      setTotalItems(total || 0);
      setTotalPages(pages || Math.ceil((total || 0) / limit));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Initial load & page change
  useEffect(() => {
    fetchCategories(currentPage);
  }, [currentPage, fetchCategories]);

  // Client-side search filter
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter(cat => cat.name.toLowerCase().includes(term));
  }, [categories, searchTerm]);

  // Pagination handlers
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handlePrev = () => goToPage(currentPage - 1);
  const handleNext = () => goToPage(currentPage + 1);

  // Toggle handler
  const handleToggle = async (categoryId, field, currentValue) => {
    if (togglingId === categoryId) return;
    setTogglingId(categoryId);

    // Optimistic update
    const updatedCategories = categories.map(cat =>
      cat._id === categoryId ? { ...cat, [field]: !currentValue } : cat
    );
    setCategories(updatedCategories);

    try {
      const formData = new FormData();
      formData.append(field, !currentValue);
      await updateCategoryAPI(categoryId, formData);
      toast.success(`${field.replace('is', '')} toggled`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update");
      // Revert
      const reverted = categories.map(cat =>
        cat._id === categoryId ? { ...cat, [field]: currentValue } : cat
      );
      setCategories(reverted);
    } finally {
      setTogglingId(null);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category permanently?")) return;
    try {
      await deleteCategoryAPI(id);
      toast.success("Category deleted");
      fetchCategories(currentPage);
      setMenuOpen(null);
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  // Sidebar
  const handleViewMore = (category) => {
    setSelectedCategory(category);
    setShowSidebar(true);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
    setSelectedCategory(null);
  };

  return (
    <div className="categories-page">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {/* Header */}
      <div className="categories-header">
        <div>
          <h2>All Categories</h2>
          <p>Manage all product categories</p>
        </div>
        <button
          className="add-category-btn"
          onClick={() => router.push("/super-admin/product-managment/product-setup/category/add")}
        >
          <span>Add New Category</span>
          <i className="bi bi-plus-lg"></i>
        </button>
      </div>

      {/* Card */}
      <div className="categories-card">
        <div className="toolbar">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search Categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="bulk-select">
            <option>Bulk Action</option>
            <option>Delete Selected</option>
            <option>Disable</option>
          </select>
        </div>

        <div className="table-responsive">
          {loading ? (
            <div className="text-center py-5">Loading categories...</div>
          ) : (
            <table className="category-table">
              <thead>
                <tr>
                  <th><input type="checkbox" /></th>
                  <th>Icon</th>
                  <th>Name</th>
                  <th>Parent Category</th>
                  <th>Order Level</th>
                  <th>Level</th>
                  <th>Featured</th>
                  <th>Hot Category</th>
                  <th className="text-end">Options</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr><td colSpan="9" className="text-center py-5 text-muted">No categories found.</td></tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category._id}>
                      <td><input type="checkbox" /></td>
                      <td>
                        <div className="category-icon">
                          {category.icon ? (
                            <img
                              src={getImageUrl(category.icon)}
                              alt={category.name}
                              style={{ width: "40px", height: "40px", objectFit: "contain" }}
                            />
                          ) : (
                            <i className="bi bi-box-seam"></i>
                          )}
                        </div>
                      </td>
                      <td className="category-name">{category.name}</td>
                      <td>{getParentName(category)}</td>
                      <td>{category.order ?? 0}</td>
                      <td>{getCategoryLevel(category)}</td>
                      <td>
                        <div
                          className={`toggle-switch ${category.isFeatured ? 'active' : ''}`}
                          onClick={() => handleToggle(category._id, 'isFeatured', category.isFeatured)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="toggle-thumb"></div>
                        </div>
                      </td>
                      <td>
                        <div
                          className={`toggle-switch ${category.isHot ? 'active' : ''}`}
                          onClick={() => handleToggle(category._id, 'isHot', category.isHot)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="toggle-thumb"></div>
                        </div>
                      </td>
                      <td className="text-end">
                        <div className="option-wrapper">
                          <button className="view-btn" onClick={() => handleViewMore(category)}>
                            View More
                          </button>
                          <button
                            className="option-btn"
                            onClick={() => setMenuOpen(menuOpen === category._id ? null : category._id)}
                          >
                            <i className="bi bi-three-dots-vertical"></i>
                          </button>
                          {menuOpen === category._id && (
                            <div className="option-menu">
                              <button
                                onClick={() => {
                                  router.push(`/super-admin/product-managment/product-setup/category/edit/${category._id}`);
                                  setMenuOpen(null);
                                }}
                              >
                                <i className="bi bi-pencil-square"></i> Edit
                              </button>
                              <button className="delete" onClick={() => handleDelete(category._id)}>
                                <i className="bi bi-trash"></i> Delete
                              </button>
                              <button
                                onClick={() => {
                                  router.push(`/super-admin/product-managment/products?category=${category._id}`);
                                  setMenuOpen(null);
                                }}
                              >
                                <i className="bi bi-box"></i> View Products
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <>
        <div className={`category-sidebar ${showSidebar ? "show" : ""}`}>
          <div className="sidebar-header">
            <h5>{selectedCategory?.name}</h5>
            <button className="close-btn" onClick={closeSidebar}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="sidebar-body">
            <div className="detail-section">
              <h6>Logo</h6>
              <div className="logo-box">
                {selectedCategory?.icon ? (
                  <img src={getImageUrl(selectedCategory.icon)} alt="icon" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <i className="bi bi-box-seam"></i>
                )}
              </div>
            </div>
            <div className="detail-section">
              <h6>Banner - Cover Image</h6>
              <div className="banner-images">
                {selectedCategory?.banner ? (
                  <img src={getImageUrl(selectedCategory.banner)} alt="banner" />
                ) : (
                  <div className="text-muted">No banner</div>
                )}
                {selectedCategory?.coverImage ? (
                  <img src={getImageUrl(selectedCategory.coverImage)} alt="cover" />
                ) : (
                  <div className="text-muted">No cover</div>
                )}
              </div>
            </div>
            <div className="detail-section">
              <h6>Products in the Category</h6>
              <div className="d-flex align-items-center gap-3">
                <span>—</span>
                <button className="view-products-btn">View Products</button>
              </div>
            </div>
            <div className="detail-section">
              <h6>Parent Category</h6>
              <p>{selectedCategory ? getParentName(selectedCategory) : "—"}</p>
            </div>
            <div className="detail-section">
              <h6>Order Level</h6>
              <p>{selectedCategory?.order ?? "—"}</p>
            </div>
            <div className="detail-section">
              <h6>Level</h6>
              <p>{selectedCategory ? getCategoryLevel(selectedCategory) : "—"}</p>
            </div>
            <div className="detail-section">
              <h6>Category Based Discount</h6>
              <button className="discount-btn">Not Applied</button>
            </div>
          </div>
        </div>
        <div className={`sidebar-overlay ${showSidebar ? "show" : ""}`} onClick={closeSidebar} />
      </>

      {/* Pagination */}
      <div className="pagination-wrapper">
        <button
          className="page-arrow"
          onClick={handlePrev}
          disabled={currentPage === 1}
          style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
        >
          <i className="bi bi-chevron-left"></i>
        </button>

        {Array.from({ length: totalPages }, (_, index) => {
          const pageNum = index + 1;
          if (
            pageNum === 1 ||
            pageNum === totalPages ||
            Math.abs(pageNum - currentPage) <= 2
          ) {
            return (
              <button
                key={pageNum}
                className={`page-number ${currentPage === pageNum ? "active" : ""}`}
                onClick={() => goToPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          } else if (pageNum === 2 && currentPage > 4) {
            return <span key="dots-left" className="page-dots">…</span>;
          } else if (pageNum === totalPages - 1 && currentPage < totalPages - 3) {
            return <span key="dots-right" className="page-dots">…</span>;
          }
          return null;
        })}

        <button
          className="page-arrow"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
        >
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}