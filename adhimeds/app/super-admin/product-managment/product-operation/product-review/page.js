'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './review.css';
import { getProductsAPI } from '../../../../services/productService';
import { getCategoriesAPI } from '../../../../services/categoryAPI';
import { deleteCustomReviewAPI, getAllCustomReviewsAPI } from '../../../../services/customReviewService';
import SERVERURL from '../../../../services/serverURL';

export default function ProductReviewsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [allProducts, setAllProducts] = useState([]);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSideModal, setShowSideModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // ── Pagination state ──
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getImageUrl = (filename) => {
    if (!filename) return null;
    return `${SERVERURL}/imgUploads/${filename}`;
  };

  // ─── Fetch data ───
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          getCategoriesAPI(),
          getProductsAPI('limit=1000'), // fetch all products for client-side pagination
        ]);

        // ─── Categories ───
        let categoriesData = [];
        if (catRes && Array.isArray(catRes.data)) {
          categoriesData = catRes.data;
        } else if (catRes && catRes.success && Array.isArray(catRes.data)) {
          categoriesData = catRes.data;
        }
        setCategories(categoriesData);

        // ─── Products ───
        let productsData = [];
        if (prodRes && Array.isArray(prodRes.data)) {
          productsData = prodRes.data;
        } else if (prodRes && prodRes.success && Array.isArray(prodRes.data)) {
          productsData = prodRes.data;
        } else {
          throw new Error(prodRes?.message || 'Failed to load products');
        }

        // ─── Reviews ───
        const allReviewsRes = await getAllCustomReviewsAPI();
        const allReviews = allReviewsRes.success ? allReviewsRes.data : [];

        const reviewsByProduct = {};
        allReviews.forEach(review => {
          const pid = review.productId?._id || review.productId;
          if (!reviewsByProduct[pid]) reviewsByProduct[pid] = [];
          reviewsByProduct[pid].push(review);
        });

        const enriched = productsData.map(product => {
          const productReviews = reviewsByProduct[product._id] || [];
          const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
          const avgRating = productReviews.length ? parseFloat((totalRating / productReviews.length).toFixed(1)) : 0;
          return {
            ...product,
            name: product.productName,
            reviews: productReviews,
            rating: avgRating,
            customReviewsCount: productReviews.length,
          };
        });

        setAllProducts(enriched);
        setDisplayProducts(enriched);
        setCurrentPage(1);
      } catch (error) {
        console.error(error);
        toast.error(error.message || 'Error loading data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Filter products when category changes ──
  useEffect(() => {
    if (selectedCategory === 'all') {
      setDisplayProducts(allProducts);
    } else {
      const selectedCatObj = categories.find(cat => (cat._id || cat.id) === selectedCategory);
      if (selectedCatObj) {
        const targetCat = selectedCatObj.name.trim().toLowerCase();
        const filtered = allProducts.filter(p => {
          const prodCat = p.mainCategory ? p.mainCategory.trim().toLowerCase() : '';
          return prodCat === targetCat;
        });
        setDisplayProducts(filtered);
      } else {
        setDisplayProducts([]);
      }
    }
    setCurrentPage(1);
  }, [selectedCategory, allProducts, categories]);

  // ── Pagination calculations ──
  const totalFiltered = displayProducts.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = displayProducts.slice(startIndex, startIndex + itemsPerPage);

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

  // ── Delete review ──
  const deleteReview = useCallback(async (productId, reviewId) => {
    if (!confirm('Delete this review?')) return;
    try {
      const res = await deleteCustomReviewAPI(reviewId);
      if (res.success) {
        toast.success('Review deleted');
        // Refresh data
        const prodRes = await getProductsAPI('limit=1000');
        const allReviewsRes = await getAllCustomReviewsAPI();
        const allReviews = allReviewsRes.success ? allReviewsRes.data : [];
        const reviewsByProduct = {};
        allReviews.forEach(review => {
          const pid = review.productId?._id || review.productId;
          if (!reviewsByProduct[pid]) reviewsByProduct[pid] = [];
          reviewsByProduct[pid].push(review);
        });
        const enriched = prodRes.data.map(product => {
          const productReviews = reviewsByProduct[product._id] || [];
          const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
          const avgRating = productReviews.length ? parseFloat((totalRating / productReviews.length).toFixed(1)) : 0;
          return {
            ...product,
            name: product.productName,
            reviews: productReviews,
            rating: avgRating,
            customReviewsCount: productReviews.length,
          };
        });
        setAllProducts(enriched);
        // reapply filter
        if (selectedCategory === 'all') setDisplayProducts(enriched);
        else {
          const selectedCatObj = categories.find(cat => (cat._id || cat.id) === selectedCategory);
          if (selectedCatObj) {
            const targetCat = selectedCatObj.name.trim().toLowerCase();
            const filtered = enriched.filter(p => {
              const prodCat = p.mainCategory ? p.mainCategory.trim().toLowerCase() : '';
              return prodCat === targetCat;
            });
            setDisplayProducts(filtered);
          }
        }
        setCurrentPage(1);
      } else {
        toast.error(res.message || 'Delete failed');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    }
  }, [selectedCategory, categories]);

  const openViewModal = (review) => {
    setSelectedReview(review);
    setShowViewModal(true);
  };

  if (loading) {
    return (
      <div className="reviews-container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="reviews-container">
      <Toaster position="top-right" />
      <div className="header-actions">
        <h4 className="page-title">All Rating & Reviews</h4>
        <button
          className="btn-add"
          onClick={() => router.push('/super-admin/product-managment/product-operation/product-review/add-custom-review')}
        >
          <i className="bi bi-plus-circle me-1"></i> Add Custom Reviews
        </button>
      </div>

      {/* Category Filter */}
      <div className="filter-bar mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <label className="form-label fw-semibold">Filter by Category</label>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="med-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Product Owner</th>
              <th>Rating</th>
              <th>Reviews</th>
              <th>Custom Reviews</th>
              <th>Options</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((prod, idx) => (
              <tr key={prod._id}>
                <td>{startIndex + idx + 1}</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    {prod.thumbnail && (
                      <img
                        src={getImageUrl(prod.thumbnail)}
                        alt={prod.name}
                        width="40"
                        height="40"
                        style={{ objectFit: 'cover', borderRadius: '8px' }}
                      />
                    )}
                    <strong>{prod.name}</strong>
                  </div>
                </td>
                <td>{prod.owner || 'Admin'}</td>
                <td>
                  <div className="stars">{'★'.repeat(Math.floor(prod.rating))}{'☆'.repeat(5 - Math.floor(prod.rating))}</div>
                  <span>{prod.rating} out of 5</span>
                </td>
                <td>{prod.reviews.length} {prod.reviews.length === 1 ? 'review' : 'reviews'}</td>
                <td>{prod.customReviewsCount}</td>
                <td>
                  <button
                    className="btn-view"
                    onClick={() => {
                      setSelectedProduct(prod);
                      setShowSideModal(true);
                    }}
                  >
                    View Reviews
                  </button>
                </td>
              </tr>
            ))}
            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">
                  No products found{selectedCategory !== 'all' ? ' in this category' : ''}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination ─── */}
      {totalFiltered > 0 && (
        <div className="pagination-wrapper">
          <div className="pagination-info">
            Showing {startItem} to {endItem} of {totalFiltered} products
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
                <li className={currentPage === 1 ? 'hidden' : ''}>
                  <button onClick={prevPage} disabled={currentPage === 1} className="pagination-btn">◀</button>
                </li>
                {pageNumbers().map((p) => (
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

      {/* ========== SIDE MODAL ========== */}
      <AnimatePresence>
        {showSideModal && selectedProduct && (
          <>
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="side-modal"
            >
              <div className="side-modal-header">
                <h5>Product Reviews – {selectedProduct.name}</h5>
                <button className="close-modal" onClick={() => setShowSideModal(false)}>×</button>
              </div>
              <div className="side-modal-body">
                <div className="product-info">
                  <p><strong>Owner:</strong> {selectedProduct.owner || 'Admin'}</p>
                  <p><strong>Overall Rating:</strong> {selectedProduct.rating} ⭐ ({selectedProduct.reviews.length} reviews)</p>
                </div>
                <div className="reviews-list">
                  <h6>All Reviews</h6>
                  {selectedProduct.reviews.length === 0 && <p className="text-muted">No reviews yet.</p>}
                  {selectedProduct.reviews.map((review) => (
                    <div key={review._id} className="review-card">
                      <div className="review-header">
                        <strong>{review.reviewerName || review.reviewer}</strong>
                        <div className="stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                        <small className="text-muted">
                          {review.reviewDate ? new Date(review.reviewDate).toLocaleDateString() : new Date(review.createdAt).toLocaleDateString()}
                        </small>
                        {review.isCustom && <span className="badge-custom ms-2">Custom</span>}
                        <div className="action-icons ms-auto">
                          <button className="action-btn view-btn" onClick={() => openViewModal(review)} title="View Details">
                            <i className="bi bi-eye"></i>
                          </button>
                          <Link
                            href={`/super-admin/product-managment/product-operation/product-review/edit-custom-review/${review._id}`}
                            className="action-btn edit-btn"
                            title="Edit Review"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button className="action-btn delete-btn" onClick={() => deleteReview(selectedProduct._id, review._id)} title="Delete Review">
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                      {review.images && review.images.length > 0 && (
                        <div className="review-images">
                          {review.images.map((img, i) => (
                            <img key={i} src={img} alt="review" width="60" className="me-1" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            <div className="side-overlay" onClick={() => setShowSideModal(false)} />
          </>
        )}
      </AnimatePresence>

      {/* ========== VIEW MODAL ========== */}
      <AnimatePresence>
        {showViewModal && selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h5>Review Details</h5>
                <button className="close-modal" onClick={() => setShowViewModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p><strong>Reviewer:</strong> {selectedReview.reviewerName || selectedReview.reviewer}</p>
                <p><strong>Rating:</strong> {selectedReview.rating} ⭐</p>
                <p><strong>Date:</strong> {selectedReview.reviewDate ? new Date(selectedReview.reviewDate).toLocaleDateString() : new Date(selectedReview.createdAt).toLocaleDateString()}</p>
                <p><strong>Comment:</strong> {selectedReview.comment}</p>
                {selectedReview.images && selectedReview.images.length > 0 && (
                  <div>
                    <strong>Images:</strong>
                    <div className="image-previews mt-2">
                      {selectedReview.images.map((img, i) => (
                        <img key={i} src={img} alt="review" width="100" className="me-2 mb-2" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowViewModal(false)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}