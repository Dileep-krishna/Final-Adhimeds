'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { getProductByIdAPI } from '../../../../services/productService';
import { updateStoreProductAccess } from '../../../../services/storeManagementAPI';
import SERVERURL from '../../../../services/serverURL';
import './StoreAccessPage.css';   // 👈 import the CSS

export default function StoreAccessPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeEmail, setStoreEmail] = useState('');
  const [enableForStore, setEnableForStore] = useState(true);
  const [saving, setSaving] = useState(false);

  // ─── Fetch product and pre‑fill email ───
  useEffect(() => {
    // 1. Load store email from storage
    const storedEmail = sessionStorage.getItem('storeEmail') || localStorage.getItem('storeEmail') || '';
    if (storedEmail) setStoreEmail(storedEmail);

    // 2. Fetch product details
    const fetchProduct = async () => {
      try {
        const res = await getProductByIdAPI(id);
        if (res.success) setProduct(res.data);
        else toast.error('Product not found');
      } catch (error) {
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const handleSubmit = async () => {
    if (!storeEmail.trim()) {
      toast.error('Please enter a store email');
      return;
    }

    setSaving(true);
    try {
      // 1. Resolve email → storeId
      const resolveUrl = `${SERVERURL}/api/store/by-email?email=${encodeURIComponent(storeEmail)}`;
      const resolveRes = await fetch(resolveUrl);
      if (!resolveRes.ok) {
        const text = await resolveRes.text();
        toast.error(`Server error: ${text.substring(0, 100)}`);
        return;
      }
      const resolveData = await resolveRes.json();
      if (!resolveData.success || !resolveData.storeId) {
        toast.error('Store not found. Please check the email.');
        return;
      }

      const storeId = resolveData.storeId;

      // 2. Update product access
      const response = await updateStoreProductAccess(id, storeId, enableForStore);
      if (response.success) {
        toast.success(`Product ${enableForStore ? 'enabled' : 'disabled'} for ${storeEmail}`);
        router.push('/All-store-management/All-Products');
      } else {
        toast.error(response.message || 'Update failed');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="store-access-wrapper"><div className="loading-text">Loading...</div></div>;
  if (!product) return <div className="store-access-wrapper"><div className="loading-text">Product not found.</div></div>;

  return (
    <div className="store-access-wrapper">
      <Toaster position="top-right" />
      <div className="access-card">
        <div className="access-card-header">
          <h5>Store Access for {product.productName}</h5>
        </div>
        <div className="access-card-body">
          <div className="mb-3">
            <label className="form-label">Store Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g., store@example.com"
              value={storeEmail}
              onChange={(e) => setStoreEmail(e.target.value)}
            />
            <small className="text-muted">Enter the store's registered email address.</small>
          </div>
          <div className="mb-3">
            <label className="form-label">Action</label>
            <div className="d-flex gap-3 mt-1">
              <label className="radio-label">
                <input type="radio" value="true" checked={enableForStore === true} onChange={() => setEnableForStore(true)} />
                Enable product for this store
              </label>
              <label className="radio-label">
                <input type="radio" value="false" checked={enableForStore === false} onChange={() => setEnableForStore(false)} />
                Disable product for this store
              </label>
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-end mt-4">
            <button className="btn-cancel" onClick={() => router.back()}>Cancel</button>
            <button className="btn-save" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Updating...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}