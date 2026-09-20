// app/super-admin/product-managment/products/components/hooks/useProducts.js
import { useState, useEffect, useCallback } from 'react';
import { getProductsAPI } from '@/app/services/productService';
import { getAllCustomReviewsAPI } from '@/app/services/customReviewService';
import toast from 'react-hot-toast';

export function useProducts({ page = 1, limit = 10, search = '', filter = '', sort = '', brand = '' } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (search) params.append('search', search);

    // ✅ Add brand filter
    if (brand) params.append('brand', brand);

    // Map filter options
    if (filter === 'published') params.append('published', 'true');
    else if (filter === 'featured') params.append('featured', 'true');

    // Map sort options
    if (sort === 'price-asc') { params.append('sortBy', 'unitPrice'); params.append('sortOrder', 'asc'); }
    else if (sort === 'price-desc') { params.append('sortBy', 'unitPrice'); params.append('sortOrder', 'desc'); }
    else if (sort === 'name-asc') { params.append('sortBy', 'productName'); params.append('sortOrder', 'asc'); }

    return params.toString();
  }, [page, limit, search, filter, sort, brand]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const query = buildQuery();
      const [productsRes, reviewsRes] = await Promise.all([
        getProductsAPI(query),
        getAllCustomReviewsAPI(),
      ]);

      if (!productsRes || !Array.isArray(productsRes.data)) {
        throw new Error(productsRes?.message || 'Failed to load products');
      }

      setTotal(productsRes.total || 0);
      setTotalPages(productsRes.totalPages || 1);

      const allReviews = reviewsRes?.success ? reviewsRes.data : [];
      const reviewsByProduct = {};
      allReviews.forEach(review => {
        const pid = review.productId?._id || review.productId;
        if (!reviewsByProduct[pid]) reviewsByProduct[pid] = [];
        reviewsByProduct[pid].push(review);
      });

      const productsWithRating = productsRes.data.map(product => {
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
  }, [buildQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, total, totalPages, fetchProducts };
}