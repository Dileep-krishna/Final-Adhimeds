'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import './custom-review.css';
import { getCategoriesAPI } from '../../../../../services/categoryAPI';
import { createCustomReviewAPI } from '../../../../../services/customReviewService';
import { getProductsAPI } from '../../../../../services/productService';

export default function AddCustomReviewPage() {
  const router = useRouter();

  const [reviewerName, setReviewerName] = useState('');
  const [reviewerImage, setReviewerImage] = useState(null);
  const [reviewerImagePreview, setReviewerImagePreview] = useState('');
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
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // ─── Fetch categories (FIXED) ───
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategoriesAPI();

        let categoriesData = [];
        if (res && Array.isArray(res.data)) {
          categoriesData = res.data;
        } else if (res && res.success && Array.isArray(res.data)) {
          categoriesData = res.data;
        } else {
          toast.error(res?.message || 'Failed to load categories');
          return;
        }

        setCategories(categoriesData);
        if (categoriesData.length) {
          setSelectedCategory(categoriesData[0]._id || categoriesData[0].id);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Server error while loading categories');
      }
    };
    fetchCategories();
  }, []);

  // ─── Fetch products when category changes ───
  useEffect(() => {
    if (!selectedCategory || categories.length === 0) return;

    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const selectedCatObj = categories.find(cat => (cat._id || cat.id) === selectedCategory);
        if (!selectedCatObj) throw new Error("Category not found");

        const categoryName = selectedCatObj.name;
        const query = `category=${encodeURIComponent(categoryName)}&limit=1000`;
        const res = await getProductsAPI(query);

        // ─── Handle products (new format) ───
        let productsData = [];
        if (res && Array.isArray(res.data)) {
          productsData = res.data;
        } else if (res && res.success && Array.isArray(res.data)) {
          productsData = res.data;
        } else {
          toast.error(res?.message || "Failed to load products");
          return;
        }

        setProducts(productsData);
        if (productsData.length > 0) {
          setSelectedProduct(productsData[0]._id);
        } else {
          setSelectedProduct("");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading products");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, categories]);

  const handleReviewerImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReviewerImage(file);
      setReviewerImagePreview(URL.createObjectURL(file));
    }
  };

  const handleReviewImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setReviewImages(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setReviewImagePreviews(previews);
  };

  const handleSubmit = async (e) => {
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

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('reviewerName', reviewerName);
      if (reviewerImage) formData.append('reviewerImage', reviewerImage);
      formData.append('categoryId', selectedCategory);
      formData.append('productId', selectedProduct);
      formData.append('rating', rating);
      formData.append('dateOption', dateOption);
      if (dateOption === 'manual') formData.append('reviewDate', manualDate);
      formData.append('comment', comment);
      reviewImages.forEach((img) => formData.append('newImages', img));

      const res = await createCustomReviewAPI(formData);
      if (res.success) {
        toast.success('Custom review added successfully');
        router.push('/super-admin/product-managment/product-operation/product-review');
      } else {
        toast.error(res.message || 'Failed to add review');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  const renderRatingStars = () => (
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
      <span className="rating-label">{rating} / 5</span>
    </div>
  );

  return (
    <div className="custom-review-page">
      <Toaster position="top-right" />
      <div className="container py-4">
        <div className="review-card">
          <div className="review-card-header">
            <div className="header-icon">
              <i className="bi bi-star-fill"></i>
            </div>
            <div>
              <h3
                className="mb-0"
                style={{
                  fontWeight: 700,
                  fontSize: '1.4rem',
                  background: 'linear-gradient(135deg, #1e293b 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: 0,
                }}
              >
                Add New Custom Review
              </h3>
              <p className="text-muted mb-0">Create a custom review for any product</p>
            </div>
          </div>

          <div className="review-card-body">
            <form onSubmit={handleSubmit}>
              {/* Reviewer Name */}
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-person"></i> Reviewer Name <span className="required">*</span>
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

              {/* Reviewer Image */}
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-image"></i> Reviewer Image
                </label>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    className="file-input"
                    accept="image/*"
                    onChange={handleReviewerImageChange}
                    id="reviewerImage"
                  />
                  <label htmlFor="reviewerImage" className="file-label">
                    <i className="bi bi-cloud-upload"></i> Choose Image
                  </label>
                  <span className="file-name">
                    {reviewerImage ? reviewerImage.name : 'No file chosen'}
                  </span>
                </div>
                {reviewerImagePreview ? (
                  <div className="avatar-preview mt-2">
                    <img src={reviewerImagePreview} alt="Reviewer preview" />
                  </div>
                ) : (
                  <div className="text-muted small mt-1">
                    <i className="bi bi-info-circle me-1"></i>
                    Default user avatar will be used if no image is uploaded
                  </div>
                )}
              </div>

              {/* Category & Product */}
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">
                      <i className="bi bi-tags"></i> Category
                    </label>
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
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">
                      <i className="bi bi-box"></i> Product <span className="required">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      required
                      disabled={loadingProducts}
                    >
                      <option value="">
                        {loadingProducts ? 'Loading products...' : 'Select Product'}
                      </option>
                      {products.map((prod) => (
                        <option key={prod._id} value={prod._id}>
                          {prod.productName}
                        </option>
                      ))}
                    </select>
                    {!loadingProducts && products.length === 0 && selectedCategory && (
                      <div className="text-warning small mt-1">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        No products found in this category
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-star"></i> Rating <span className="required">*</span>
                </label>
                {renderRatingStars()}
              </div>

              {/* Date */}
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-calendar"></i> Date
                </label>
                <div className="date-options">
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
                    <label className="form-check-label" htmlFor="systemDate">
                      System Date
                    </label>
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
                    <label className="form-check-label" htmlFor="manualDate">
                      Manual Date
                    </label>
                  </div>
                </div>
                {dateOption === 'manual' && (
                  <input
                    type="date"
                    className="form-control manual-date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                  />
                )}
              </div>

              {/* Comment */}
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-chat"></i> Comment <span className="required">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write your review comment here..."
                  required
                />
              </div>

              {/* Review Images */}
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-images"></i> Review Images
                </label>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    className="file-input"
                    accept="image/*"
                    multiple
                    onChange={handleReviewImagesChange}
                    id="reviewImages"
                  />
                  <label htmlFor="reviewImages" className="file-label">
                    <i className="bi bi-cloud-upload"></i> Choose Images
                  </label>
                  <span className="file-name">
                    {reviewImages.length > 0 ? `${reviewImages.length} files selected` : 'No files chosen'}
                  </span>
                </div>
                {reviewImagePreviews.length > 0 && (
                  <div className="image-preview-grid">
                    {reviewImagePreviews.map((src, idx) => (
                      <div key={idx} className="preview-item">
                        <img src={src} alt={`Preview ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-muted small mt-1">
                  <i className="bi bi-info-circle me-1"></i>
                  Upload square images for best display in the review gallery
                </div>
              </div>

              {/* Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => router.back()}
                >
                  <i className="bi bi-arrow-left me-1"></i> Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-1"></i> Save Review
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