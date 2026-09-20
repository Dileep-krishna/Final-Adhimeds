'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { getProductByIdAPI } from '../../../../services/productService';
import { getAllCustomReviewsAPI } from '../../../../services/customReviewService';
import SERVERURL from '../../../../services/serverURL';
import './ProductViewPage.css';   // 👈 import the new CSS

export default function ProductViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);

  const getImageUrl = (filename) => (filename ? `${SERVERURL}/imgUploads/${filename}` : '');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          getProductByIdAPI(id),
          getAllCustomReviewsAPI(),
        ]);
        if (!productRes.success) throw new Error('Product not found');
        const p = productRes.data;
        setProduct(p);

        // Calculate ratings
        const allReviews = reviewsRes.success ? reviewsRes.data : [];
        const productReviews = allReviews.filter(r => r.productId === id);
        const total = productReviews.reduce((sum, r) => sum + r.rating, 0);
        setReviewCount(productReviews.length);
        setAvgRating(productReviews.length ? (total / productReviews.length) : 0);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className="product-view-wrapper text-center py-5">Loading...</div>;
  if (!product) return <div className="product-view-wrapper text-center py-5">Product not found.</div>;

  const imageUrl = getImageUrl(product.thumbnail);

  return (
    <div className="product-view-wrapper container-fluid py-4" style={{ maxWidth: '1000px' }}>
      <Toaster position="top-right" />
      <button className="back-btn mb-4 px-3 py-2 rounded-pill" onClick={() => router.back()}>
        <i className="bi bi-arrow-left me-1"></i> Back
      </button>

      <div className="product-card shadow-sm">
        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-5 text-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.productName}
                  className="img-fluid rounded"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />
              ) : (
                <div className="placeholder-image rounded p-5" style={{ height: '300px' }}>
                  <i className="bi bi-image fs-1"></i>
                </div>
              )}
            </div>
            <div className="col-md-7">
              <h2 className="product-title">{product.productName}</h2>
              <p className="product-meta"><strong className="product-label">Brand:</strong> <span className="product-value">{product.brand}</span></p>
              <p className="product-meta"><strong className="product-label">Category:</strong> <span className="product-value">{product.mainCategory}</span></p>
              <p className="product-meta"><strong className="product-label">Unit:</strong> <span className="product-value">{product.unit || 'N/A'}</span></p>
              <p className="product-meta"><strong className="product-label">Weight:</strong> <span className="product-value">{product.weight} kg</span></p>
              <p className="product-meta"><strong className="product-label">Min Qty:</strong> <span className="product-value">{product.minPurchaseQty}</span></p>
              <p className="product-meta"><strong className="product-label">Price:</strong> <span className="product-value">₹{product.unitPrice}</span></p>
              <p className="product-meta"><strong className="product-label">Discount:</strong> <span className="product-value">{product.discount > 0 ? `${product.discount}%` : 'None'}</span></p>
              <p className="product-meta"><strong className="product-label">Stock:</strong> <span className="product-value">{product.stock}</span></p>
              <p className="product-meta"><strong className="product-label">SKU:</strong> <span className="product-value">{product.sku || 'N/A'}</span></p>
              <p className="product-meta"><strong className="product-label">Barcode:</strong> <span className="product-value">{product.barcode || 'N/A'}</span></p>
              <p className="product-meta"><strong className="product-label">HSN:</strong> <span className="product-value">{product.hsnCode || 'N/A'}</span></p>
              <p className="product-meta"><strong className="product-label">GST:</strong> <span className="product-value">{product.gstRate || 0}%</span></p>
              {avgRating > 0 && (
                <p className="rating-text"><strong className="product-label">Rating:</strong> <span className="product-value">{avgRating.toFixed(1)}/5 ({reviewCount} reviews)</span></p>
              )}
              {product.description && (
                <div className="product-description mt-3">
                  <strong className="product-label">Description:</strong>
                  <p className="product-value">{product.description}</p>
                </div>
              )}
              {product.galleryImages?.length > 0 && (
                <div className="mt-3">
                  <strong className="product-label">Gallery:</strong>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {product.galleryImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={getImageUrl(img)}
                        width="80"
                        height="80"
                        className="gallery-thumb"
                        style={{ objectFit: 'cover', borderRadius: '8px' }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}