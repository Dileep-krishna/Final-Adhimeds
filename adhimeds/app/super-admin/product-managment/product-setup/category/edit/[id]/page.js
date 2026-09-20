"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Select from "react-select";
import "./edit-category.css";
import SERVERURL from "@/app/services/serverURL";

export default function EditCategoryPage() {
  const router = useRouter();
  const { id } = useParams(); // Get category ID from URL
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // Loading state for initial data fetch

  const [formData, setFormData] = useState({
    name: "",
    parent: "",
    order: 0,
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
  });

  const [bannerFile, setBannerFile] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [categories, setCategories] = useState([]);
  const [attributeOptions, setAttributeOptions] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);

  // ─── Refs for file inputs ───
  const bannerInputRef = useRef(null);
  const iconInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const BASE_URL = `${SERVERURL}/api/category`;
  const ATTRIBUTES_URL = `${SERVERURL}/api/attributes`;

  // ─── Fetch all categories for parent dropdown ───
  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}?limit=100`);
      setCategories(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  }, [BASE_URL]);

  // ─── Fetch attributes for filtering attributes ───
  const fetchAttributes = useCallback(async () => {
    try {
      const res = await axios.get(ATTRIBUTES_URL);
      const attrs = res.data.data || [];
      setAttributeOptions(
        attrs.map((attr) => ({
          value: attr._id,
          label: attr.name,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch attributes", err);
      // Fallback static options
      setAttributeOptions([
        { value: "size", label: "Size" },
        { value: "fabric", label: "Fabric" },
        { value: "liter", label: "Liter" },
        { value: "storage", label: "Storage" },
        { value: "sleeve", label: "Sleeve" },
      ]);
    }
  }, [ATTRIBUTES_URL]);

  // ─── Fetch the category to edit ───
  const fetchCategory = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/${id}`);
      const cat = res.data.data;

      // Populate formData
      setFormData({
        name: cat.name || "",
        parent: cat.parent?._id || cat.parent || "",
        order: cat.order || 0,
        metaTitle: cat.metaTitle || "",
        metaDescription: cat.metaDescription || "",
        metaKeywords: cat.metaKeywords || "",
      });

      // Set previews for existing images (full URLs)
      if (cat.banner) {
        setBannerPreview(`${SERVERURL}/imgUploads/${cat.banner}`);
        // Store the existing filename so we can decide later if a new file is uploaded
        // We'll keep track via the file state; if a new file is selected, it will override.
      }
      if (cat.icon) setIconPreview(`${SERVERURL}/imgUploads/${cat.icon}`);
      if (cat.coverImage) setCoverPreview(`${SERVERURL}/imgUploads/${cat.coverImage}`);

      // Set selected attributes (if any)
      if (cat.filteringAttributes && cat.filteringAttributes.length > 0) {
        const selected = cat.filteringAttributes.map((attr) => ({
          value: attr._id || attr,
          label: attr.name || attr,
        }));
        setSelectedAttributes(selected);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load category");
      router.push("/super-admin/product-managment/product-setup/category");
    } finally {
      setFetching(false);
    }
  }, [id, router, BASE_URL]);

  // ─── Initial load ───
  useEffect(() => {
    fetchCategories();
    fetchAttributes();
    fetchCategory();

    // Cleanup object URLs on unmount
    return () => {
      [bannerPreview, iconPreview, coverPreview].forEach((url) => {
        if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, []);

  // ─── Handlers ───
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (setFile, setPreview, currentPreview) => (e) => {
    const file = e.target.files[0];
    if (file) {
      // Revoke old preview if it's a blob URL
      if (currentPreview && currentPreview.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = (ref) => {
    ref.current?.click();
  };

  // ─── Submit ───
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("order", Number(formData.order) || 0);
      data.append("metaTitle", formData.metaTitle);
      data.append("metaDescription", formData.metaDescription);
      data.append("metaKeywords", formData.metaKeywords);
      data.append(
        "filteringAttributes",
        JSON.stringify(selectedAttributes.map((opt) => opt.value))
      );

      // Handle parent: send "null" if empty
      if (formData.parent === "") {
        data.append("parent", "null");
      } else if (formData.parent) {
        data.append("parent", formData.parent);
      }

      // Only append files if a new one is selected
      if (bannerFile) data.append("banner", bannerFile);
      if (iconFile) data.append("icon", iconFile);
      if (coverFile) data.append("coverImage", coverFile);

      await axios.put(`${BASE_URL}/${id}`, data);
      toast.success("Category updated successfully");
      router.push("/super-admin/product-managment/product-setup/category");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  // ─── React‑Select styles (same as add page) ───
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: 52,
      borderRadius: 8,
      borderColor: state.isFocused
        ? "var(--accent, #0d6efd)"
        : "var(--border-color, #d0d5dd)",
      boxShadow: state.isFocused
        ? "0 0 0 4px rgba(var(--accent-rgb, 13, 110, 253), 0.12)"
        : "none",
      background: "var(--input-bg, #fff)",
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 999999,
      background: "var(--bg-card, #fff)",
      border: "1px solid var(--border-color, #d0d5dd)",
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: 250,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? "var(--bg-hover, #eef5ff)"
        : "transparent",
      color: state.isSelected
        ? "#fff"
        : "var(--text-primary, #1d2939)",
      ":active": { backgroundColor: "var(--accent, #0d6efd)" },
    }),
    multiValue: (provided) => ({
      ...provided,
      background: "var(--bg-secondary, #e8f1ff)",
      borderRadius: 6,
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "var(--accent, #0d6efd)",
      fontWeight: 500,
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "var(--accent, #0d6efd)",
      ":hover": {
        background: "var(--accent, #0d6efd)",
        color: "#fff",
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "var(--text-secondary, #98a2b3)",
    }),
    input: (provided) => ({
      ...provided,
      color: "var(--text-primary, #1d2939)",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "var(--text-primary, #1d2939)",
    }),
  };

  // ─── Show loading spinner while fetching data ───
  if (fetching) {
    return (
      <div className="category-page">
        <div className="loading-spinner">Loading category...</div>
      </div>
    );
  }

  return (
    <div className="category-page">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <div className="category-card">
        <div className="card-header">
          <h3>Edit Category</h3>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ─── Name ─── */}
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              name="name"
              placeholder="Category Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* ─── Parent Category ─── */}
          <div className="form-group">
            <label>Parent Category</label>
            <select name="parent" value={formData.parent} onChange={handleChange}>
              <option value="">No Parent</option>
              {categories
                .filter((cat) => cat._id !== id) // exclude itself
                .map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          {/* ─── Ordering Number ─── */}
          <div className="form-group">
            <label>Ordering Number</label>
            <input
              type="number"
              name="order"
              placeholder="Order Level"
              value={formData.order}
              onChange={handleChange}
            />
            <small>Higher number has high priority</small>
          </div>

          {/* ─── Banner ─── */}
          <div className="form-group">
            <label>Banner</label>
            <div className="upload-box">
              <button
                type="button"
                className="browse-btn"
                onClick={() => triggerFileInput(bannerInputRef)}
              >
                Browse
              </button>
              <span>{bannerFile ? bannerFile.name : "Choose File"}</span>
              <input
                type="file"
                accept="image/*"
                ref={bannerInputRef}
                onChange={handleFileChange(
                  setBannerFile,
                  setBannerPreview,
                  bannerPreview
                )}
                style={{ display: "none" }}
              />
            </div>
            {bannerPreview && (
              <img src={bannerPreview} className="preview-img" alt="banner" />
            )}
            <small>Minimum dimensions required: 150 × 150</small>
          </div>

          {/* ─── Icon ─── */}
          <div className="form-group">
            <label>Icon</label>
            <div className="upload-box">
              <button
                type="button"
                className="browse-btn"
                onClick={() => triggerFileInput(iconInputRef)}
              >
                Browse
              </button>
              <span>{iconFile ? iconFile.name : "Choose File"}</span>
              <input
                type="file"
                accept="image/*"
                ref={iconInputRef}
                onChange={handleFileChange(
                  setIconFile,
                  setIconPreview,
                  iconPreview
                )}
                style={{ display: "none" }}
              />
            </div>
            {iconPreview && (
              <img src={iconPreview} className="preview-icon" alt="icon" />
            )}
            <small>Minimum dimensions required: 16 × 16</small>
          </div>

          {/* ─── Cover Image ─── */}
          <div className="form-group">
            <label>Cover Image</label>
            <div className="upload-box">
              <button
                type="button"
                className="browse-btn"
                onClick={() => triggerFileInput(coverInputRef)}
              >
                Browse
              </button>
              <span>{coverFile ? coverFile.name : "Choose File"}</span>
              <input
                type="file"
                accept="image/*"
                ref={coverInputRef}
                onChange={handleFileChange(
                  setCoverFile,
                  setCoverPreview,
                  coverPreview
                )}
                style={{ display: "none" }}
              />
            </div>
            {coverPreview && (
              <img src={coverPreview} className="preview-img" alt="cover" />
            )}
          </div>

          {/* ─── Meta Title ─── */}
          <div className="form-group">
            <label>Meta Title</label>
            <input
              type="text"
              name="metaTitle"
              placeholder="Meta Title"
              value={formData.metaTitle}
              onChange={handleChange}
            />
          </div>

          {/* ─── Meta Description ─── */}
          <div className="form-group">
            <label>Meta Description</label>
            <textarea
              rows="6"
              name="metaDescription"
              placeholder="Meta Description"
              value={formData.metaDescription}
              onChange={handleChange}
            />
          </div>

          {/* ─── Meta Keywords ─── */}
          <div className="form-group">
            <label>Meta Keywords</label>
            <input
              type="text"
              name="metaKeywords"
              placeholder="Keyword, Keyword"
              value={formData.metaKeywords}
              onChange={handleChange}
            />
            <small>Separate with comma</small>
          </div>

          {/* ─── Filtering Attributes ─── */}
          <div className="form-group">
            <label>Filtering Attributes</label>
            <Select
              isMulti
              options={attributeOptions}
              value={selectedAttributes}
              onChange={setSelectedAttributes}
              placeholder="Nothing selected"
              closeMenuOnSelect={false}
              className="attribute-select"
              classNamePrefix="select"
              styles={customStyles}
              menuPlacement="auto"
            />
          </div>

          {/* ─── Footer ─── */}
          <div className="form-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => router.push("/super-admin/product-managment/product-setup/category")}
            >
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              <i className="bi bi-check-lg"></i>
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}