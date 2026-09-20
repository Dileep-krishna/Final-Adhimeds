'use client';

import { useState, useEffect, useMemo, useCallback, useRef, memo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './All-Products.css';
import SERVERURL from '../../services/serverURL';
import { getProductsAPI } from '../../services/productService';
import { getAllCustomReviewsAPI } from '../../services/customReviewService';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function usePagination(totalItems, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);
  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);
  return { currentPage, totalPages, goToPage, nextPage, prevPage, setCurrentPage };
}

// ─── Product Row – with navigation ───
const ProductRow = memo(({ product, onTogglePin, isPinned, getImageUrl }) => {
  const router = useRouter();
  const thumbnailUrl = getImageUrl(product.thumbnail);
  return (
    <tr key={product._id}>
      <td>
        <div className="d-flex align-items-center gap-2">
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={product.productName}
              width="40"
              height="40"
              loading="lazy"
              decoding="async"
              style={{ objectFit: 'cover', borderRadius: '8px' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <div>
            <div className="product-name">{product.productName}</div>
            <small>{product.brand}</small>
          </div>
        </div>
      </td>
      <td>{product.brand}</td>
      <td>{product.mainCategory}</td>
      <td>
        {product.avgRating > 0 ? (
          <div>
            <div className="stars">{'⭐'.repeat(Math.floor(product.avgRating))}</div>
            <small>{product.avgRating}/5 ({product.reviewCount} reviews)</small>
          </div>
        ) : '—'}
      </td>
      <td>₹{product.unitPrice}</td>
      <td>{product.discount > 0 ? `${product.discount}%` : '—'}</td>
      <td>
        <button
          className="btn-icon view-btn"
          onClick={() => router.push(`/All-store-management/All-Products/product-view/${product._id}`)}
          title="View Details"
        >
          <i className="bi bi-eye"></i>
        </button>
      </td>
      <td>
        <button
          className="btn-icon pin-btn"
          onClick={() => onTogglePin(product._id)}
          title="Pin to top"
          style={{ background: 'none', border: 'none', color: isPinned ? '#f59e0b' : '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
        >
          <i className={`bi ${isPinned ? 'bi-star-fill' : 'bi-star'}`}></i>
        </button>
      </td>
      <td>
        <button
          className="btn-icon store-access-btn"
          onClick={() => router.push(`/All-store-management/All-Products/store-access/${product._id}`)}
          title="Enable/Disable for store"
          style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '1.2rem', cursor: 'pointer' }}
        >
          <i className="bi bi-shop"></i>
        </button>
      </td>
    </tr>
  );
});
ProductRow.displayName = 'ProductRow';

// ─── Skeleton Row ───
const SkeletonRow = memo(() => (
  <tr className="skeleton-row">
    <td><div className="skeleton" style={{ width: '120px', height: '40px' }}></div></td>
    <td><div className="skeleton" style={{ width: '80px', height: '20px' }}></div></td>
    <td><div className="skeleton" style={{ width: '100px', height: '20px' }}></div></td>
    <td><div className="skeleton" style={{ width: '80px', height: '20px' }}></div></td>
    <td><div className="skeleton" style={{ width: '60px', height: '20px' }}></div></td>
    <td><div className="skeleton" style={{ width: '50px', height: '20px' }}></div></td>
    <td><div className="skeleton" style={{ width: '30px', height: '30px', borderRadius: '50%' }}></div></td>
    <td><div className="skeleton" style={{ width: '30px', height: '30px', borderRadius: '50%' }}></div></td>
    <td><div className="skeleton" style={{ width: '40px', height: '20px' }}></div></td>
  </tr>
));
SkeletonRow.displayName = 'SkeletonRow';

export const dynamic = "force-dynamic";

export default function AllProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ─── Pins ───
  const getCurrentEmail = () => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('storeEmail') || localStorage.getItem('storeEmail') || '';
  };

  const getPinnedStorageKey = (email) => {
    if (email && email !== 'null' && email !== 'undefined') {
      return `pinnedProductIds_${email}`;
    }
    return 'pinnedProductIds';
  };

  const initialEmail = getCurrentEmail();
  const initialKey = getPinnedStorageKey(initialEmail);
  const initialPins = (() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(initialKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
    }
    return [];
  })();

  const [pinnedProductIds, setPinnedProductIds] = useState(initialPins);

  // ─── Debounce & transition ───
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isPending, startTransition] = useTransition();

  const getImageUrl = useCallback((filename) => {
    if (!filename) return null;
    return `${SERVERURL}/imgUploads/${filename}`;
  }, []);

  // ─── Save pins on change ───
  useEffect(() => {
    const email = getCurrentEmail();
    const key = getPinnedStorageKey(email);
    localStorage.setItem(key, JSON.stringify(pinnedProductIds));
  }, [pinnedProductIds]);

  // ─── Fetch products (FIXED: handles new API format) ───
const fetchProducts = useCallback(async () => {
  setLoading(true);
  try {
    const [productsRes, reviewsRes] = await Promise.all([
      getProductsAPI('limit=1000'),   // ✅ fetch all products for client pagination
      getAllCustomReviewsAPI(),
    ]);

    if (!productsRes || !Array.isArray(productsRes.data)) {
      throw new Error(productsRes?.message || 'Failed to load products');
    }

    const productsData = productsRes.data;
    const allReviews = reviewsRes?.success ? reviewsRes.data : [];

    const reviewsByProduct = {};
    allReviews.forEach(review => {
      const pid = review.productId?._id || review.productId;
      if (!reviewsByProduct[pid]) reviewsByProduct[pid] = [];
      reviewsByProduct[pid].push(review);
    });

    const productsWithRating = productsData.map(product => {
      const productReviews = reviewsByProduct[product._id] || [];
      const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = productReviews.length
        ? parseFloat((totalRating / productReviews.length).toFixed(1))
        : 0;
      return { ...product, avgRating, reviewCount: productReviews.length };
    });

    setProducts(productsWithRating);
  } catch (error) {
    console.error('Error fetching products:', error);
    toast.error('Server error while loading products');
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ─── Filter & sort ───
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      result = result.filter(p =>
        p.productName?.toLowerCase().includes(searchLower) ||
        p.brand?.toLowerCase().includes(searchLower)
      );
    }
    if (filterOption === 'published') result = result.filter(p => p.published === true);
    if (filterOption === 'featured') result = result.filter(p => p.featured === true);
    if (filterOption === 'todayDeal') result = result.filter(p => p.todaysDeal === true);
    if (filterOption === 'discount') result = result.filter(p => p.discount > 0);
    if (sortOption === 'price-asc') result.sort((a, b) => (a.unitPrice || 0) - (b.unitPrice || 0));
    if (sortOption === 'price-desc') result.sort((a, b) => (b.unitPrice || 0) - (a.unitPrice || 0));
    if (sortOption === 'rating-desc') result.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    if (sortOption === 'name-asc') result.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
    const pinnedItems = result.filter(p => pinnedProductIds.includes(p._id));
    const unpinnedItems = result.filter(p => !pinnedProductIds.includes(p._id));
    return [...pinnedItems, ...unpinnedItems];
  }, [products, debouncedSearchTerm, filterOption, sortOption, pinnedProductIds]);

  // ─── Pagination ───
  const { currentPage, totalPages, goToPage, nextPage, prevPage, setCurrentPage } =
    usePagination(filteredAndSortedProducts.length, itemsPerPage);

  useEffect(() => setCurrentPage(1), [debouncedSearchTerm, filterOption, sortOption, pinnedProductIds, setCurrentPage]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedProducts, currentPage, itemsPerPage]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  // ─── Handlers ───
  const handleTogglePin = useCallback((productId) => {
    setPinnedProductIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setFilterOption('');
    setSortOption('');
    setCurrentPage(1);
    setPinnedProductIds([]);
  }, [setCurrentPage]);

  const handleItemsPerPageChange = useCallback((e) => {
    setItemsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  }, [setCurrentPage]);

  const handleSearchChange = useCallback((e) => {
    startTransition(() => setSearchTerm(e.target.value));
  }, []);

  const startItem = filteredAndSortedProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length);

  return (
    <div className="all-products-container">
      <Toaster position="top-right" />
      
      {/* ─── Page title ─── */}
      <div className="header-actions">
        <h4 className="page-title">All Products</h4>
      </div>

      {/* ─── Products Card ─── */}
      <div className="products-card">
        {/* ─── Filter Header ─── */}
        <div className="products-header">
          <div className="filter-bar">
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="col-md-3">
                <select className="form-select" value={filterOption} onChange={(e) => setFilterOption(e.target.value)}>
                  <option value="">Filter</option>
                  <option value="published">Published</option>
                  <option value="featured">Featured</option>
                  <option value="todayDeal">Today's Deal</option>
                  <option value="discount">Has Discount</option>
                </select>
              </div>
              <div className="col-md-3">
                <select className="form-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                  <option value="">Sort</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                  <option value="rating-desc">Highest Rated</option>
                  <option value="name-asc">Name (A-Z)</option>
                </select>
              </div>
              <div className="col-md-2">
                <button className="btn btn-outline-secondary w-100" onClick={resetFilters}>Reset</button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Table ─── */}
        <div className="table-responsive">
          {loading ? (
            <table className="med-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Rating</th>
                  <th>Price (₹)</th>
                  <th>Discount</th>
                  <th>View</th>
                  <th>Pin</th>
                  <th>Store Access</th>
                </tr>
              </thead>
              <tbody>
                {Array(itemsPerPage).fill(null).map((_, idx) => (
                  <SkeletonRow key={idx} />
                ))}
              </tbody>
            </table>
          ) : (
            <>
              <table className="med-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Rating</th>
                    <th>Price (₹)</th>
                    <th>Discount</th>
                    <th>View</th>
                    <th>Pin</th>
                    <th>Store Access</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map(product => (
                    <ProductRow
                      key={product._id}
                      product={product}
                      onTogglePin={handleTogglePin}
                      isPinned={pinnedProductIds.includes(product._id)}
                      getImageUrl={getImageUrl}
                    />
                  ))}
                  {paginatedProducts.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-4">No products found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {filteredAndSortedProducts.length > 0 && (
                <div className="pagination-controls">
                  <div className="pagination-info">
                    Showing {startItem} to {endItem} of {filteredAndSortedProducts.length} products
                  </div>
                  <div className="pagination-actions">
                    <select
                      className="form-select per-page-select"
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                    >
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                    <nav>
                      <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={prevPage} disabled={currentPage === 1}>
                            <i className="bi bi-chevron-left"></i>
                          </button>
                        </li>
                        {pageNumbers.map(pageNum => (
                          <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => goToPage(pageNum)}>
                              {pageNum}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={nextPage} disabled={currentPage === totalPages}>
                            <i className="bi bi-chevron-right"></i>
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
    </div>
  );
}