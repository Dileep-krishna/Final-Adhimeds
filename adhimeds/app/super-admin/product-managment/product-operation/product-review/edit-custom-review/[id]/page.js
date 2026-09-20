'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { getCustomReviewById, updateCustomReviewAPI } from '../../../../../../services/customReviewService';
import { getCategoriesAPI } from '../../../../../../services/categoryAPI';
import { getProductsAPI } from '../../../../../../services/productService';
import "./edit-review.css"
export default function EditCustomReviewPage() {
  const router = useRouter();
  const params = useParams();
  let reviewId = params?.id;

  // MANUAL FALLBACK: if params.id is undefined, extract from URL path
  const [manualId, setManualId] = useState(null);
  useEffect(() => {
    if (!reviewId) {
      const path = window.location.pathname;
      const parts = path.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart !== 'edit-custom-review') {
        setManualId(lastPart);
        console.log("🔧 Manual ID extracted:", lastPart);
      }
    }
  }, [reviewId]);

  // Use manualId if available, otherwise reviewId from params
  const effectiveId = reviewId || manualId;

  console.log("🔁 EditCustomReviewPage rendered, params.id:", reviewId, "effectiveId:", effectiveId);
  console.log("📍 Current URL:", typeof window !== 'undefined' ? window.location.href : 'server');

  const [reviewerName, setReviewerName] = useState('');
  const [reviewerImage, setReviewerImage] = useState(null);
  const [reviewerImagePreview, setReviewerImagePreview] = useState('');
  const [existingReviewerImageUrl, setExistingReviewerImageUrl] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [rating, setRating] = useState(5);
  const [dateOption, setDateOption] = useState('system');
  const [manualDate, setManualDate] = useState('');
  const [comment, setComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState([]);
  const [existingReviewImages, setExistingReviewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const productFetchRef = useRef(false);

  // Fetch review data (only if we have an ID)
  useEffect(() => {
    if (!effectiveId) {
      console.error("❌ No reviewId available (neither params nor manual)");
      setFetching(false);
      return;
    }

    const fetchAllData = async () => {
      console.log("🔄 fetchAllData started for ID:", effectiveId);
      setFetching(true);
      try {
        const [reviewRes, categoriesRes] = await Promise.all([
          getCustomReviewById(effectiveId),
          getCategoriesAPI(),
        ]);
        console.log("✅ Review API response:", reviewRes);
        console.log("✅ Categories API response:", categoriesRes);

        if (reviewRes.success && reviewRes.data) {
          const review = reviewRes.data;
          setReviewerName(review.reviewerName);
          setExistingReviewerImageUrl(review.reviewerImage || '');
          const catId = review.categoryId?._id || review.categoryId;
          setSelectedCategory(catId);
          setSelectedProduct(review.productId?._id || review.productId);
          setRating(review.rating);
          if (review.reviewDate) {
            setDateOption('manual');
            setManualDate(review.reviewDate.split('T')[0]);
          } else {
            setDateOption('system');
          }
          setComment(review.comment);
          setExistingReviewImages(review.images || []);
        } else {
          toast.error(reviewRes.message || 'Failed to load review');
          router.push('/super-admin/product-managment/product-operation/product-review');
          return;
        }

        if (categoriesRes.success && categoriesRes.data) {
          setCategories(categoriesRes.data);
        } else {
          toast.error('Failed to load categories');
        }
      } catch (error) {
        console.error("🔥 fetchAllData error:", error);
        toast.error('Error loading data');
        router.push('/super-admin/product-managment/product-operation/product-review');
      } finally {
        setFetching(false);
      }
    };

    fetchAllData();
  }, [effectiveId, router]);

  // Fetch products when category changes
  useEffect(() => {
    if (!selectedCategory || categories.length === 0) return;
    if (productFetchRef.current) return;
    productFetchRef.current = true;

    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const selectedCatObj = categories.find(cat => (cat._id || cat.id) === selectedCategory);
        if (!selectedCatObj) return;
        const categoryName = selectedCatObj.name;
        const query = `category=${encodeURIComponent(categoryName)}`;
        const res = await getProductsAPI(query);
        if (res.success && res.data) {
          setProducts(res.data);
          if (!selectedProduct && res.data.length) {
            setSelectedProduct(res.data[0]._id);
          }
        } else {
          toast.error(res.message || 'Failed to load products');
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, categories]);

  const handleReviewerImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setReviewerImage(file);
      setReviewerImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const handleReviewImagesChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    setReviewImages(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setReviewImagePreviews(previews);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!reviewerName.trim()) {
      toast.error('Reviewer name is required');
      return;
    }
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }
    if (!comment.trim()) {
      toast.error('Comment is required');
      return;
    }
    if (!effectiveId) {
      toast.error('Review ID missing');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('reviewerName', reviewerName);
      if (reviewerImage) formData.append('reviewerImage', reviewerImage);
      else if (existingReviewerImageUrl) formData.append('existingReviewerImageUrl', existingReviewerImageUrl);
      formData.append('categoryId', selectedCategory);
      formData.append('productId', selectedProduct);
      formData.append('rating', rating);
      formData.append('dateOption', dateOption);
      if (dateOption === 'manual') formData.append('reviewDate', manualDate);
      formData.append('comment', comment);
      reviewImages.forEach((img) => formData.append('newImages', img));
      formData.append('existingImages', JSON.stringify(existingReviewImages));

      const res = await updateCustomReviewAPI(effectiveId, formData);
      if (res.success) {
        toast.success('Custom review updated successfully');
        router.push('/super-admin/product-managment/product-operation/product-review');
      } else {
        toast.error(res.message || 'Failed to update review');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  }, [reviewerName, reviewerImage, existingReviewerImageUrl, selectedCategory, selectedProduct, rating, dateOption, manualDate, comment, reviewImages, existingReviewImages, effectiveId, router]);

  const renderRatingStars = useCallback(() => (
    <div className="rating-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= rating ? 'active' : ''}`}
          onClick={() => setRating(star)}
        >
          ★
        </button>
      ))}
    </div>
  ), [rating]);

  if (fetching) {
    return (
      <div className="custom-review-page">
        <div className="container py-4 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading review...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!effectiveId) {
    return (
      <div className="custom-review-page">
        <div className="container py-4 text-center">
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>Invalid review ID.</strong> The URL does not contain a valid identifier.
            <div className="mt-3">
              <button className="btn btn-primary" onClick={() => router.push('/super-admin/product-managment/product-operation/product-review')}>
                Back to Reviews
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-review-page">
      <Toaster position="top-right" />
      <div className="container py-4">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-0 pt-4 pb-0">
            <h3 className="mb-0">
              <i className="bi bi-pencil-square text-warning me-2"></i>
              Edit Custom Review
            </h3>
            <hr className="mt-3" />
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Custom Reviewer Name */}
              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Custom Reviewer Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g., John Doe"
                  required
                />
              </div>

              {/* Custom Reviewer Image */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Custom Reviewer Image</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleReviewerImageChange}
                />
                {(reviewerImagePreview || existingReviewerImageUrl) && (
                  <div className="mt-2">
                    <img
                      src={reviewerImagePreview || existingReviewerImageUrl}
                      alt="Reviewer preview"
                      width={80}
                      height={80}
                      style={{ objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                )}
                <div className="mt-2 text-muted small">
                  <i className="bi bi-person-circle me-1"></i>
                  If you do not use custom reviewer's image it will show default user image.
                </div>
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Category</label>
                <select
                  className="form-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat._id || cat.id} value={cat._id || cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Product <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  required
                  disabled={loadingProducts}
                >
                  <option value="">{loadingProducts ? 'Loading products...' : 'Select Product'}</option>
                  {products.map((prod) => (
                    <option key={prod._id || prod.id} value={prod._id || prod.id}>
                      {prod.productName || prod.name}
                    </option>
                  ))}
                </select>
                <div className="form-text">Select Product for Custom Review</div>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Rating *</label>
                {renderRatingStars()}
              </div>

              {/* Date */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Date</label>
                <div className="d-flex gap-4 mb-2">
                  <div className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      id="systemDate"
                      name="dateOption"
                      value="system"
                      checked={dateOption === 'system'}
                      onChange={() => setDateOption('system')}
                    />
                    <label className="form-check-label" htmlFor="systemDate">System Date</label>
                  </div>
                  <div className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      id="manualDate"
                      name="dateOption"
                      value="manual"
                      checked={dateOption === 'manual'}
                      onChange={() => setDateOption('manual')}
                    />
                    <label className="form-check-label" htmlFor="manualDate">Select</label>
                  </div>
                </div>
                {dateOption === 'manual' && (
                  <input
                    type="date"
                    className="form-control w-auto"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                  />
                )}
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Comment *</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Your review"
                  required
                />
              </div>

              {/* Review Images */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Review Images</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  multiple
                  onChange={handleReviewImagesChange}
                />
                {existingReviewImages.length > 0 && (
                  <div className="mt-3">
                    <label className="fw-semibold">Current Images</label>
                    <div className="d-flex flex-wrap gap-3 mt-2">
                      {existingReviewImages.map((imgUrl, idx) => (
                        <img
                          key={idx}
                          src={imgUrl}
                          alt={`Existing ${idx + 1}`}
                          width={100}
                          height={100}
                          style={{ objectFit: 'cover', borderRadius: '0.25rem' }}
                          className="border"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {reviewImagePreviews.length > 0 && (
                  <div className="mt-3">
                    <label className="fw-semibold">New Images</label>
                    <div className="d-flex flex-wrap gap-3 mt-2">
                      {reviewImagePreviews.map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          alt={`Preview ${idx + 1}`}
                          width={100}
                          height={100}
                          style={{ objectFit: 'cover', borderRadius: '0.25rem' }}
                          className="border"
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div className="form-text mt-2">
                  These images are visible in product review page gallery. Upload square images.
                </div>
              </div>

              {/* Save Button */}
              <div className="d-flex justify-content-end">
                <button
                  type="submit"
                  className="btn-save-update"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save me-2"></i> Update Review
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}