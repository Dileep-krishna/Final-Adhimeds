'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './product-details.css'; // We'll provide CSS
import { getProductsAPI } from '@/app/services/productService';
import { getAllCustomReviewsAPI } from '@/app/services/customReviewService';
import SERVERURL from '@/app/services/serverURL';




export default function ProductDetailsPage() {
  const router = useRouter();
  const { id } = useParams(); // product ID from URL
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const [productsRes, reviewsRes] = await Promise.all([
          getProductsAPI(),
          getAllCustomReviewsAPI(),
        ]);

        if (!productsRes.success) throw new Error('Failed to load products');

        const productData = productsRes.data.find(p => p._id === id);
        if (!productData) throw new Error('Product not found');

        const allReviews = reviewsRes.success ? reviewsRes.data : [];
        const productReviews = allReviews.filter(r => (r.productId?._id || r.productId) === id);
        const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = productReviews.length ? parseFloat((totalRating / productReviews.length).toFixed(1)) : 0;

        setProduct({
          ...productData,
          avgRating,
          reviewCount: productReviews.length,
        });
      } catch (err) {
        console.error(err);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const getImageUrl = (filename) => {
    if (!filename) return null;
    return `${SERVERURL}/imgUploads/${filename}`;
  };

  if (loading) {
    return (
      <div className="product-details-container">
        <div className="loading-spinner"><div className="spinner-border text-primary" role="status"></div></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-container">
        <div className="error-state">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <p>{error || 'Product not found'}</p>
          <button className="btn btn-primary" onClick={() => router.back()}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-details-container">
      <Toaster position="top-right" />
      <div className="details-header">
        <button className="btn-back" onClick={() => router.back()}>
          <i className="bi bi-arrow-left"></i> Back
        </button>
        <h1 className="product-title">{product.productName}</h1>
        <div className="product-meta">
          <span className="badge bg-primary">{product.mainCategory}</span>
          <span className="badge bg-secondary">{product.brand}</span>
        </div>
      </div>

      <div className="details-grid">
        {/* Left Column – Images */}
        <div className="image-section">
          {product.thumbnail && (
            <img
              src={getImageUrl(product.thumbnail)}
              alt={product.productName}
              className="main-image"
            />
          )}
          {product.galleryImages && product.galleryImages.length > 0 && (
            <div className="gallery-thumbnails">
              {product.galleryImages.map((img, idx) => (
                <img key={idx} src={getImageUrl(img)} alt={`gallery-${idx}`} className="thumb" />
              ))}
            </div>
          )}
        </div>

        {/* Right Column – Details */}
        <div className="info-section">
          <div className="info-row">
            <span className="label">Price</span>
            <span className="value">₹{product.unitPrice}</span>
          </div>
          {product.discount > 0 && (
            <div className="info-row">
              <span className="label">Discount</span>
              <span className="value text-success">{product.discount}%</span>
            </div>
          )}
          <div className="info-row">
            <span className="label">Stock</span>
            <span className={`value ${product.stock > 0 ? 'text-success' : 'text-danger'}`}>
              {product.stock > 0 ? `${product.stock} units` : 'Out of Stock'}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Rating</span>
            <span className="value">
              {product.avgRating > 0 ? (
                <>
                  <span className="stars">{'⭐'.repeat(Math.floor(product.avgRating))}</span>
                  {product.avgRating}/5 ({product.reviewCount} reviews)
                </>
              ) : 'No reviews yet'}
            </span>
          </div>
          <div className="info-row">
            <span className="label">SKU</span>
            <span className="value">{product.sku || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">Barcode</span>
            <span className="value">{product.barcode || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">HSN Code</span>
            <span className="value">{product.hsnCode || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">GST Rate</span>
            <span className="value">{product.gstRate || 0}%</span>
          </div>
          <div className="info-row">
            <span className="label">Unit</span>
            <span className="value">{product.unit || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">Weight</span>
            <span className="value">{product.weight} kg</span>
          </div>
          <div className="info-row">
            <span className="label">Minimum Qty</span>
            <span className="value">{product.minPurchaseQty}</span>
          </div>
          <div className="info-row">
            <span className="label">Published</span>
            <span className="value">{product.published ? '✅ Yes' : '❌ No'}</span>
          </div>
          <div className="info-row">
            <span className="label">Featured</span>
            <span className="value">{product.featured ? '✅ Yes' : '❌ No'}</span>
          </div>
          <div className="info-row">
            <span className="label">Today's Deal</span>
            <span className="value">{product.todaysDeal ? '✅ Yes' : '❌ No'}</span>
          </div>
          {product.description && (
            <div className="info-row full">
              <span className="label">Description</span>
              <p className="value">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}