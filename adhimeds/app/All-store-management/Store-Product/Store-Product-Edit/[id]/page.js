'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Select from 'react-select';

import './StoreProductEdit.css';
import { getAllBrands } from '../../../../services/brandAPI';
import { getCategoriesAPI } from '../../../../services/categoryAPI';
import { getWarrantiesAPI } from '../../../../services/warrentyAPI';
import { getColorsAPI } from '../../../../services/colorAPI';
import { getAttributesAPI } from '../../../../services/attributeAPI';
import {
  getProductByIdAPI,
  updateProductAPI,
} from '../../../../services/productService';
import {
  updateStoreProductPriceStock,
  getStoreProductDetails,
} from '../../../../services/storeManagementAPI';
import SERVERURL from '../../../../services/serverURL';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Store ID: from URL first, then sessionStorage
  const [storeId, setStoreId] = useState(null);
  const [storeIdSource, setStoreIdSource] = useState(null);

  useEffect(() => {
    const fromUrl = searchParams.get('storeId');
    if (fromUrl && fromUrl !== 'null' && fromUrl !== 'undefined') {
      setStoreId(fromUrl);
      setStoreIdSource('URL');
      return;
    }
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('storeId');
      if (stored && stored !== 'null' && stored !== 'undefined') {
        setStoreId(stored);
        setStoreIdSource('sessionStorage');
      }
    }
  }, [searchParams]);

  // ========== DYNAMIC DROPDOWN DATA ==========
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [attributeOptions, setAttributeOptions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedAttributeValues, setSelectedAttributeValues] = useState({});

  // ========== FORM STATE ==========
  const [formData, setFormData] = useState({
    productName: '',
    mainCategory: '',
    brand: '',
    relatedCategories: [],
    unit: '',
    weight: 0,
    minPurchaseQty: 1,
    barcode: '',
    tags: [],
    tagInput: '',
    published: true,
    featured: false,
    todaysDeal: false,
    flashTitle: '',
    discount: 0,
    discountType: 'percent',
    discountStartDate: '',
    discountEndDate: '',
    refundable: false,
    refundNote: 'This product is eligible for return within 7 days of delivery.',
    warrantyEnabled: false,
    warrantyType: '',
    warrantyNote: 'This is a demo warranty note...',
    freeShipping: true,
    flatRate: false,
    quantityMultiply: false,
    shippingDays: '',
    showShippingTime: false,
    showShippingNote: false,
    shippingNote: 'This is a demo shipping note...',
    codAvailable: false,
    codNote: 'This is a demo delivery note...',
    hsnCode: '',
    gstRate: 0,
    metaTitle: '',
    metaDescription: '',
    metaImage: null,
    seoTags: [],
    seoTagInput: '',
    thumbnail: null,
    galleryImages: [],
    youtubeUrls: [''],
    videoFile: null,
    videoThumbnail: null,
    pdfSpec: null,
    unitPrice: 0,
    stock: 0,
    sku: '',
    colorsEnabled: false,
    selectedColors: [],
    variants: [],
    hideStockState: 'none',
    lowStockWarning: 0,
    defaultQuantity: 1,
    frequentlyBought: [],
    selectedAttributes: [],
  });

  const [existingThumbnail, setExistingThumbnail] = useState('');
  const [existingMetaImage, setExistingMetaImage] = useState('');
  const [existingGalleryImages, setExistingGalleryImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const getImageUrl = (filename) => (filename ? `${SERVERURL}/imgUploads/${filename}` : '');

  const extractDataArray = (response) => {
    if (Array.isArray(response)) return response;
    if (response?.data && Array.isArray(response.data)) return response.data;
    if (response?.success && Array.isArray(response.data)) return response.data;
    return [];
  };

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [brandRes, catRes, warrantyRes, colorRes, attrRes] = await Promise.all([
          getAllBrands(),
          getCategoriesAPI(),
          getWarrantiesAPI(),
          getColorsAPI(),
          getAttributesAPI(),
        ]);
        setBrands(extractDataArray(brandRes));
        setCategories(extractDataArray(catRes));
        const rawWarranties = extractDataArray(warrantyRes);
        const mappedWarranties = rawWarranties.map((w) => ({ ...w, name: w.text || w.name || 'Unnamed' }));
        setWarranties(mappedWarranties);
        setColorOptions(extractDataArray(colorRes));
        const attributes = extractDataArray(attrRes);
        setAttributeOptions(attributes);
        const initialSelections = {};
        attributes.forEach((attr) => {
          initialSelections[attr._id] = [];
        });
        setSelectedAttributeValues(initialSelections);
      } catch (error) {
        toast.error('Failed to load dropdown data');
      } finally {
        setLoadingData(false);
      }
    };
    fetchDropdownData();
  }, []);

  // Fetch product data – conditional based on storeId
  useEffect(() => {
    if (!id) {
      toast.error('Invalid product ID');
      router.push('/super-admin/product-managment/products/all-product');
      return;
    }
    const fetchProduct = async () => {
      setLoading(true);
      try {
        let res;
        if (storeId) {
          res = await getStoreProductDetails(id, storeId);
        } else {
          res = await getProductByIdAPI(id);
        }
        if (res.success && res.data) {
          const p = res.data;
          setFormData({
            productName: p.productName || '',
            mainCategory: p.mainCategory || '',
            brand: p.brand || '',
            relatedCategories: p.relatedCategories || [],
            unit: p.unit || '',
            weight: p.weight || 0,
            minPurchaseQty: p.minPurchaseQty || 1,
            barcode: p.barcode || '',
            tags: p.tags || [],
            tagInput: '',
            published: p.published ?? true,
            featured: p.featured ?? false,
            todaysDeal: p.todaysDeal ?? false,
            flashTitle: p.flashTitle || '',
            discount: p.discount || 0,
            discountType: p.discountType || 'percent',
            discountStartDate: p.discountStartDate ? p.discountStartDate.split('T')[0] : '',
            discountEndDate: p.discountEndDate ? p.discountEndDate.split('T')[0] : '',
            refundable: p.refundable ?? false,
            refundNote: p.refundNote || '',
            warrantyEnabled: p.warrantyEnabled || false,
            warrantyType: p.warrantyType || '',
            warrantyNote: p.warrantyNote || '',
            freeShipping: p.freeShipping ?? true,
            flatRate: p.flatRate || false,
            quantityMultiply: p.quantityMultiply || false,
            shippingDays: p.shippingDays || '',
            showShippingTime: p.showShippingTime || false,
            showShippingNote: p.showShippingNote || false,
            shippingNote: p.shippingNote || '',
            codAvailable: p.codAvailable || false,
            codNote: p.codNote || '',
            hsnCode: p.hsnCode || '',
            gstRate: p.gstRate || 0,
            metaTitle: p.metaTitle || '',
            metaDescription: p.metaDescription || '',
            metaImage: null,
            seoTags: p.seoTags || [],
            seoTagInput: '',
            thumbnail: null,
            galleryImages: [],
            youtubeUrls: p.youtubeUrls || [''],
            videoFile: null,
            videoThumbnail: null,
            pdfSpec: null,
            unitPrice: (p.customPrice ?? p.unitPrice) || 0,
            stock: (p.customStock ?? p.stock) || 0,
            sku: p.sku || '',
            colorsEnabled: p.colorsEnabled || false,
            selectedColors: p.selectedColors || [],
            variants: p.variants || [],
            hideStockState: p.hideStockState || 'none',
            lowStockWarning: p.lowStockWarning || 0,
            defaultQuantity: p.defaultQuantity || 1,
            frequentlyBought: p.frequentlyBought || [],
            selectedAttributes: p.selectedAttributes || [],
          });
          setExistingThumbnail(p.thumbnail || '');
          setExistingMetaImage(p.metaImage || '');
          setExistingGalleryImages(p.galleryImages || []);

          if (p.attributes && p.attributes.length) {
            const attrSelections = {};
            p.attributes.forEach((attr) => {
              const foundAttr = attributeOptions.find((a) => a.name === attr.name);
              if (foundAttr) {
                const valuesWithPackSizes = attr.values.map((v) => {
                  if (typeof v === 'string') return { value: v, packSizes: [] };
                  return { value: v.value, packSizes: v.packSizes || [] };
                });
                attrSelections[foundAttr._id] = valuesWithPackSizes;
              }
            });
            setSelectedAttributeValues(attrSelections);
          }
        } else {
          toast.error(res.message || 'Product not found');
          router.push('/All-store-management/Store-Product');
        }
      } catch (error) {
        toast.error('Server error loading product');
      } finally {
        setLoading(false);
      }
    };
    if (attributeOptions.length > 0 || !storeId) {
      fetchProduct();
    }
  }, [id, router, attributeOptions, storeId, storeIdSource]);

  // Only handle changes for unitPrice and stock
  const handleChange = (field, value) => {
    if (field === 'unitPrice' || field === 'stock') {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Empty handlers for other fields (disabled)
  const addTag = () => {};
  const removeTag = () => {};
  const addSeoTag = () => {};
  const removeSeoTag = () => {};
  const handleGalleryChange = () => {};
  const removeGalleryImage = () => {};
  const addYouTubeUrl = () => {};
  const updateYouTubeUrl = () => {};
  const removeYouTubeUrl = () => {};
  const addFrequentlyBought = () => {};
  const updateFrequentlyBought = () => {};
  const removeFrequentlyBought = () => {};
  const handleAttributeSelectChange = () => {};
  const handleAttributeValueChange = () => {};
  const handlePackSizesChange = () => {};

  const categorySelectOptions = categories.map((cat) => ({ value: cat.name, label: cat.name }));
  const selectedCategoryOptions = categorySelectOptions.filter((opt) =>
    formData.relatedCategories.includes(opt.value)
  );

  const colorSelectOptions = colorOptions.map((c) => ({ value: c.name, label: c.name, colorCode: c.code }));
  const selectedColorOptions = colorSelectOptions.filter((opt) => formData.selectedColors.includes(opt.value));

  const attributeSelectOptions = attributeOptions.map((attr) => ({ value: attr._id, label: attr.name }));
  const selectedAttributeOptions = attributeSelectOptions.filter((opt) =>
    formData.selectedAttributes.includes(opt.value)
  );

  const ColorOption = (props) => {
    const { data, innerProps, isSelected } = props;
    return (
      <div
        {...innerProps}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '5px 10px',
          cursor: 'pointer',
          backgroundColor: isSelected ? '#e0e0e0' : 'transparent',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 20,
            height: 20,
            backgroundColor: data.colorCode,
            marginRight: 10,
            borderRadius: 3,
            border: '1px solid #ccc',
          }}
        ></span>
        <span>{data.label}</span>
      </div>
    );
  };

  const buildAttributesPayload = () => {
    const payload = [];
    formData.selectedAttributes.forEach((attrId) => {
      const attr = attributeOptions.find((a) => a._id === attrId);
      const selectedItems = selectedAttributeValues[attrId] || [];
      if (attr && selectedItems.length) {
        payload.push({
          name: attr.name,
          values: selectedItems.map((item) => ({
            value: item.value,
            packSizes: item.packSizes,
          })),
        });
      }
    });
    return payload;
  };

  // ─── SUBMIT HANDLER – using the store API ───
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate price and stock
    if (formData.unitPrice <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (formData.stock < 0) {
      toast.error('Stock cannot be negative');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        unitPrice: parseFloat(formData.unitPrice),
        stock: parseInt(formData.stock)
      };

      let res;
      if (storeId) {
        res = await updateStoreProductPriceStock(id, storeId, payload);
      } else {
        res = await updateProductAPI(id, payload);
      }

      if (res.success) {
        toast.success('Product price and stock updated successfully!');
        setTimeout(() => {
          if (storeId) {
            router.push('/All-store-management/Store-Product');
          } else {
            router.push('/super-admin/product-managment/products/all-product');
          }
        }, 1500);
      } else {
        toast.error(res.message || 'Update failed');
      }
    } catch (error) {
      toast.error('Server error while updating');
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingData)
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );

  return (
    <div className="add-product-page">
      <Toaster position="top-right" />
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="page-title">Edit Product</h1>
          <div className="d-flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </div>

        <form id="editProductForm" className="row g-4" onSubmit={handleSubmit}>
          {/* LEFT COLUMN */}
          <div className="col-md-6">
            {/* Basic Info - DISABLED */}
            <div className="form-card">
              <div className="card-header">Product Basic Information</div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.productName}
                    disabled
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Select Main Category *</label>
                  <select
                    className="form-select"
                    value={formData.mainCategory}
                    disabled
                    style={{ backgroundColor: '#e9ecef' }}
                  >
                    <option value="">Select Main Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Brand / Manufacturer *</label>
                  <select
                    className="form-select"
                    value={formData.brand}
                    disabled
                    style={{ backgroundColor: '#e9ecef' }}
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Configuration - DISABLED */}
            <div className="form-card">
              <div className="card-header">Product Configuration</div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Related Categories</label>
                  <Select
                    isMulti
                    options={categorySelectOptions}
                    value={selectedCategoryOptions}
                    isDisabled
                    classNamePrefix="react-select"
                  />
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label">Unit *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.unit}
                      disabled
                      style={{ backgroundColor: '#e9ecef' }}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Weight (Kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.weight}
                      disabled
                      style={{ backgroundColor: '#e9ecef' }}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Minimum Purchase Qty *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.minPurchaseQty}
                    disabled
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Barcode</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.barcode}
                    disabled
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Tags</label>
                  <div className="tag-input-container">
                    {formData.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Files & Media - DISABLED */}
            <div className="form-card">
              <div className="card-header">Files & Media</div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Thumbnail</label>
                  <input
                    type="file"
                    className="form-control"
                    disabled
                  />
                  {existingThumbnail && (
                    <img src={getImageUrl(existingThumbnail)} alt="current" width="80" className="mt-2" />
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Gallery Images</label>
                  <input
                    type="file"
                    className="form-control"
                    multiple
                    disabled
                  />
                  <div className="gallery-preview mt-2 d-flex flex-wrap gap-2">
                    {existingGalleryImages.map((img, idx) => (
                      <img key={idx} src={getImageUrl(img)} width="60" className="border rounded" />
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <label>YouTube links</label>
                  {formData.youtubeUrls.map((url, idx) => (
                    <div key={idx} className="mb-2">
                      <input
                        type="url"
                        className="form-control"
                        value={url}
                        disabled
                        style={{ backgroundColor: '#e9ecef' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SEO - DISABLED */}
            <div className="form-card">
              <div className="card-header">SEO Meta Tags</div>
              <div className="card-body">
                <div className="mb-3">
                  <label>Meta Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.metaTitle}
                    disabled
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </div>
                <div className="mb-3">
                  <label>Meta Description</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    value={formData.metaDescription}
                    disabled
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </div>
                <div className="mb-3">
                  <label>SEO Tags</label>
                  <div className="tag-input-container">
                    {formData.seoTags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Price & Stock - EDITABLE */}
            <div className="form-card" style={{ border: '2px solid #007bff', boxShadow: '0 0 10px rgba(0,123,255,0.1)' }}>
              <div className="card-header" style={{ backgroundColor: '#007bff', color: 'white' }}>
                Product Price & Stock (Editable)
              </div>
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-12">
                    <label className="form-label">Unit price * (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.unitPrice}
                      onChange={(e) => handleChange('unitPrice', e.target.value)}
                      step="0.01"
                      min="0"
                      required
                      style={{ border: '2px solid #007bff' }}
                    />
                  </div>
                  <div className="col-6">
                    <label>Discount</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.discount}
                      disabled
                      style={{ backgroundColor: '#e9ecef' }}
                    />
                  </div>
                  <div className="col-6">
                    <label>Discount Type</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.discountType}
                      disabled
                      style={{ backgroundColor: '#e9ecef' }}
                    />
                  </div>
                  <div className="col-12">
                    <label>Stock *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.stock}
                      onChange={(e) => handleChange('stock', e.target.value)}
                      step="1"
                      min="0"
                      required
                      style={{ border: '2px solid #007bff' }}
                    />
                  </div>
                  <div className="col-12">
                    <label>SKU</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.sku}
                      disabled
                      style={{ backgroundColor: '#e9ecef' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Colors - DISABLED */}
            <div className="form-card">
              <div className="card-header">Colors</div>
              <div className="card-body">
                <div className="toggle-item">
                  <label className="toggle-switch">
                    <input type="checkbox" checked={formData.colorsEnabled} disabled />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label">Enable Color Variation</span>
                </div>
                {formData.colorsEnabled && (
                  <div className="mt-2">
                    <Select
                      isMulti
                      options={colorSelectOptions}
                      value={selectedColorOptions}
                      isDisabled
                      classNamePrefix="react-select"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Attributes - DISABLED */}
            <div className="form-card">
              <div className="card-header">Attributes</div>
              <div className="card-body">
                <Select
                  isMulti
                  options={attributeSelectOptions}
                  value={selectedAttributeOptions}
                  isDisabled
                  classNamePrefix="react-select"
                />
              </div>
            </div>

            {/* Variants table - DISABLED */}
            {formData.variants.length > 0 && (
              <div className="form-card">
                <div className="card-header">Product Variants</div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Variant</th>
                          <th>Price (₹)</th>
                          <th>SKU</th>
                          <th>Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.variants.map((v, idx) => (
                          <tr key={idx}>
                            <td>{v.variant}</td>
                            <td>{v.price}</td>
                            <td>{v.sku}</td>
                            <td>{v.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - All DISABLED */}
          <div className="col-md-6">
            <div className="form-card">
              <div className="card-header">Product Settings</div>
              <div className="card-body">
                <div className="toggle-item">
                  <label className="toggle-switch">
                    <input type="checkbox" checked={formData.published} disabled />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label">Published</span>
                </div>
                <div className="toggle-item">
                  <label className="toggle-switch">
                    <input type="checkbox" checked={formData.featured} disabled />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label">Featured</span>
                </div>
                <div className="toggle-item">
                  <label className="toggle-switch">
                    <input type="checkbox" checked={formData.todaysDeal} disabled />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label">Today's Deal</span>
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">Flash Sale</div>
              <div className="card-body">
                <div className="mb-3">
                  <label>Flash Title</label>
                  <input type="text" className="form-control" value={formData.flashTitle} disabled style={{ backgroundColor: '#e9ecef' }} />
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">Refund</div>
              <div className="card-body">
                <div className="toggle-item">
                  <label className="toggle-switch">
                    <input type="checkbox" checked={formData.refundable} disabled />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label">Refundable</span>
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">Warranty</div>
              <div className="card-body">
                <div className="toggle-item">
                  <label className="toggle-switch">
                    <input type="checkbox" checked={formData.warrantyEnabled} disabled />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label">Enable warranty</span>
                </div>
                <div className="mt-2">
                  <label>Warranty Type</label>
                  <input type="text" className="form-control" value={formData.warrantyType} disabled style={{ backgroundColor: '#e9ecef' }} />
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">Shipping</div>
              <div className="card-body">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked={formData.freeShipping} disabled />
                  <label>Free Shipping</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked={formData.flatRate} disabled />
                  <label>Flat Rate</label>
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">Cash on Delivery</div>
              <div className="card-body">
                <div className="toggle-item">
                  <label className="toggle-switch">
                    <input type="checkbox" checked={formData.codAvailable} disabled />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label">COD available</span>
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">HSN & GST</div>
              <div className="card-body">
                <div className="mb-3">
                  <label>HSN Code</label>
                  <input type="text" className="form-control" value={formData.hsnCode} disabled style={{ backgroundColor: '#e9ecef' }} />
                </div>
                <div className="mb-3">
                  <label>GST Rate (%)</label>
                  <input type="number" className="form-control" value={formData.gstRate} disabled style={{ backgroundColor: '#e9ecef' }} />
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">Stock & Order Display</div>
              <div className="card-body">
                <div className="mb-3">
                  <label>Hide Stock Visibility</label>
                  <input type="text" className="form-control" value={formData.hideStockState} disabled style={{ backgroundColor: '#e9ecef' }} />
                </div>
                <div className="mb-3">
                  <label>Low Stock Warning</label>
                  <input type="number" className="form-control" value={formData.lowStockWarning} disabled style={{ backgroundColor: '#e9ecef' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button at Bottom */}
          <div className="col-12">
            <div className="form-card">
              <div className="card-body text-center">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg px-5"
                  disabled={saving}
                  style={{ minWidth: '250px' }}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Updating Price & Stock...
                    </>
                  ) : (
                    'Update Price & Stock Only'
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-lg px-5 ms-3"
                  onClick={() => router.back()}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}