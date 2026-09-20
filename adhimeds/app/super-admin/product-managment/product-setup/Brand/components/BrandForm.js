'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createBrand, updateBrand } from '../../../../../services/brandAPI';


export default function BrandForm({ initialData = null, isEdit = false }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    logo: null,
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || '',
    metaKeywords: initialData?.metaKeywords || '',
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'logo') {
      setFormData({ ...formData, logo: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validate name
    const brandName = (formData.name || '').trim();
    if (!brandName) {
      toast.error('Brand name is required');
      return;
    }

    console.log('📤 Submitting brand with name:', brandName);

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('name', brandName);          // ✅ send trimmed, non‑empty name
      if (formData.logo) payload.append('logo', formData.logo);
      if (formData.metaTitle) payload.append('metaTitle', formData.metaTitle);
      if (formData.metaDescription) payload.append('metaDescription', formData.metaDescription);
      if (formData.metaKeywords) payload.append('metaKeywords', formData.metaKeywords);

      // Debug: log all FormData entries
      console.log('📦 FormData contents:');
      for (let [key, value] of payload.entries()) {
        console.log(`  ${key}:`, value);
      }

      let res;
      if (isEdit && initialData?._id) {
        res = await updateBrand(initialData._id, payload);
      } else {
        res = await createBrand(payload);
      }

      if (res.success) {
        toast.success(isEdit ? 'Brand updated' : 'Brand created');
        router.push('/super-admin/product-managment/product-setup/Brand');
      } else {
        toast.error(res.message || 'Operation failed');
      }
    } catch (error) {
      console.error('❌ Submit error:', error);
      toast.error('Server error while saving brand');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h3 mb-0">
            <i className="bi bi-building text-success me-2"></i>
            {isEdit ? 'Edit Brand' : 'Add New Brand'}
          </h2>
          <button className="btn btn-outline-secondary" onClick={() => router.back()}>
            <i className="bi bi-arrow-left me-1"></i> Cancel
          </button>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Brand Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Cipla, Sun Pharma"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Brand Logo</label>
                  <input
                    type="file"
                    className="form-control"
                    name="logo"
                    accept="image/*"
                    onChange={handleChange}
                  />
                  <div className="form-text">Recommended: 100x100px (JPEG, PNG)</div>
                  {initialData?.logo && !formData.logo && (
                    <div className="mt-2">
                      <p className="small text-muted mb-1">Current logo:</p>
                      <img
                        src={`${process.env.NEXT_PUBLIC_SERVERURL}${initialData.logo}`}
                        alt="logo"
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    </div>
                  )}
                </div>

                <div className="col-md-12">
                  <label className="form-label fw-semibold">Meta Title</label>
                  <input
                    type="text"
                    className="form-control"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleChange}
                    placeholder="SEO title (max 60 chars)"
                  />
                </div>

                <div className="col-md-12">
                  <label className="form-label fw-semibold">Meta Description</label>
                  <textarea
                    className="form-control"
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Brief description for search engines (150–160 chars)"
                  />
                </div>

                <div className="col-md-12">
                  <label className="form-label fw-semibold">Meta Keywords</label>
                  <input
                    type="text"
                    className="form-control"
                    name="metaKeywords"
                    value={formData.metaKeywords}
                    onChange={handleChange}
                    placeholder="comma, separated, keywords"
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
                  Back
                </button>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    isEdit ? 'Update Brand' : 'Create Brand'
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