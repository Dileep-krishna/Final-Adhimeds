'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './add-product.css';
import { createProductAPI, deleteProductAPI } from '../../../../services/productService';
import { getAllBrands } from '../../../../services/brandAPI';
import { getCategoriesAPI } from '../../../../services/categoryAPI';
import { getWarrantiesAPI } from '../../../../services/warrentyAPI';
import { getColorsAPI } from '../../../../services/colorAPI';
import { getAttributesAPI } from '../../../../services/attributeAPI';
import Select from 'react-select';

export default function AddProductPage() {
  const router = useRouter();

  // ========== DYNAMIC DROPDOWN DATA ==========
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [attributeOptions, setAttributeOptions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // New: each attribute can have multiple selected values, each with its chosen pack sizes
  // Structure: { [attributeId]: [{ value: string, packSizes: string[] }] }
  const [selectedAttributeValues, setSelectedAttributeValues] = useState({});

  const extractDataArray = (response) => {
    if (Array.isArray(response)) return response;
    if (response?.data && Array.isArray(response.data)) return response.data;
    if (response?.success && Array.isArray(response.data)) return response.data;
    return [];
  };

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
        const mappedWarranties = rawWarranties.map(w => ({
          ...w,
          name: w.text || w.name || 'Unnamed',
        }));
        setWarranties(mappedWarranties);

        setColorOptions(extractDataArray(colorRes));
        const attributes = extractDataArray(attrRes);
        setAttributeOptions(attributes);

        // Initialize selected values for each attribute as empty array
        const initialSelections = {};
        attributes.forEach(attr => {
          initialSelections[attr._id] = [];
        });
        setSelectedAttributeValues(initialSelections);
      } catch (error) {
        console.error('Error loading dropdown data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoadingData(false);
      }
    };
    fetchDropdownData();
  }, []);

  // ========== FORM STATE ==========
  const [formData, setFormData] = useState({
    productName: '', mainCategory: '', brand: '',
    relatedCategories: [], unit: '', weight: '', minPurchaseQty: 1,
    barcode: '', tags: [], tagInput: '',
    published: true, featured: false, todaysDeal: false,
    flashTitle: '', discount: 0, discountType: 'percent',
    discountStartDate: '', discountEndDate: '',
    refundable: false, refundNote: 'This product is eligible for return within 7 days of delivery.',
    warrantyEnabled: false, warrantyType: '',
    warrantyNote: 'This is a demo warranty note for Active eCommerce CMS, developed by Active IT Zo...',
    freeShipping: true, flatRate: false, quantityMultiply: false,
    shippingDays: '', showShippingTime: false, showShippingNote: false,
    shippingNote: 'This is a demo shipping note for Active eCommerce CMS, developed by Active IT Zo...',
    codAvailable: false, codNote: 'This is a demo delivery note for Active eCommerce CMS, developed by Active IT Zo...',
    hsnCode: '', gstRate: '',
    metaTitle: '', metaDescription: '', metaImage: null,
    seoTags: [], seoTagInput: '',
    thumbnail: null, galleryImages: [], youtubeUrls: [''],
    videoFile: null, videoThumbnail: null, pdfSpec: null,
    unitPrice: 0, stock: 0, sku: '',
    colorsEnabled: false, selectedColors: [],   // array for react-select
    variants: [],
    hideStockState: 'none',
    lowStockWarning: 0,
    defaultQuantity: 1,
    frequentlyBought: [{ product: '', category: '' }],
    selectedAttributes: []   // stores IDs of attributes selected for this product
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ========== COMPUTE VARIANTS (ONLY COLORS) ==========
  const computeVariants = () => {
    const colors = formData.colorsEnabled ? formData.selectedColors : [];
    if (colors.length === 0) return [];

    const variants = [];
    for (const color of colors) {
      const variantName = color;
      const sku = variantName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      variants.push({
        variant: variantName,
        price: formData.unitPrice,
        sku: sku,
        quantity: 0,
        photo: null,
      });
    }
    return variants;
  };

  // Auto‑generate variants when colors or color toggle changes
  useEffect(() => {
    if (formData.colorsEnabled) {
      const newVariants = computeVariants();
      setFormData(prev => ({ ...prev, variants: newVariants }));
    } else {
      setFormData(prev => ({ ...prev, variants: [] }));
    }
  }, [formData.colorsEnabled, formData.selectedColors]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Colors multi‑select using react‑select (with swatch)
  const colorSelectOptions = colorOptions.map(color => ({
    value: color.name,
    label: color.name,
    colorCode: color.code
  }));

  const handleColorSelectChange = (selectedOptions) => {
    const selectedColors = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    setFormData(prev => ({ ...prev, selectedColors }));
  };

  // Related Categories multi‑select using react‑select
  const categorySelectOptions = categories.map(cat => ({
    value: cat.name,
    label: cat.name
  }));

  const handleRelatedCategoriesChange = (selectedOptions) => {
    const selected = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    setFormData(prev => ({ ...prev, relatedCategories: selected }));
  };

  // ========== ATTRIBUTE HANDLERS (ENHANCED) ==========
  const handleAttributeSelectChange = (selectedOptions) => {
    const selectedIds = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    // When removing an attribute, also remove its selected values from state
    const newSelectedValues = { ...selectedAttributeValues };
    Object.keys(newSelectedValues).forEach(attrId => {
      if (!selectedIds.includes(attrId)) {
        delete newSelectedValues[attrId];
      }
    });
    setSelectedAttributeValues(newSelectedValues);
    setFormData(prev => ({ ...prev, selectedAttributes: selectedIds }));
  };

  // Update selected values + pack sizes for a given attribute
  const handleAttributeValueChange = (attrId, selectedOptions) => {
    const selected = selectedOptions ? selectedOptions.map(opt => ({
      value: opt.value,
      packSizes: []   // initial empty; user will choose pack sizes later
    })) : [];
    setSelectedAttributeValues(prev => ({
      ...prev,
      [attrId]: selected
    }));
  };

  // Update pack sizes for a specific attribute value
  const handlePackSizesChange = (attrId, value, selectedOptions) => {
    const selectedPackSizes = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    setSelectedAttributeValues(prev => {
      const attrValues = [...(prev[attrId] || [])];
      const index = attrValues.findIndex(v => v.value === value);
      if (index !== -1) {
        attrValues[index].packSizes = selectedPackSizes;
      }
      return { ...prev, [attrId]: attrValues };
    });
  };

  const updateVariant = (idx, field, value) => {
    const updated = [...formData.variants];
    updated[idx][field] = value;
    setFormData(prev => ({ ...prev, variants: updated }));
  };

  // ========== FREQUENTLY BOUGHT ==========
  const addFrequentlyBought = () => {
    setFormData(prev => ({ ...prev, frequentlyBought: [...prev.frequentlyBought, { product: '', category: '' }] }));
  };
  const updateFrequentlyBought = (idx, field, value) => {
    const updated = [...formData.frequentlyBought];
    updated[idx][field] = value;
    setFormData(prev => ({ ...prev, frequentlyBought: updated }));
  };
  const removeFrequentlyBought = (idx) => {
    const updated = formData.frequentlyBought.filter((_, i) => i !== idx);
    setFormData(prev => ({ ...prev, frequentlyBought: updated }));
  };

  // ========== TAGS ==========
  const addTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, prev.tagInput.trim()], tagInput: '' }));
    }
  };

  const removeTag = (tag) => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));

  // ========== SEO TAGS ==========
  const addSeoTag = () => {
    if (formData.seoTagInput.trim() && !formData.seoTags.includes(formData.seoTagInput.trim())) {
      setFormData(prev => ({ ...prev, seoTags: [...prev.seoTags, prev.seoTagInput.trim()], seoTagInput: '' }));
    }
  };
  const removeSeoTag = (tag) => setFormData(prev => ({ ...prev, seoTags: prev.seoTags.filter(t => t !== tag) }));

  const generateBarcode = () => {
    const code = Math.random().toString(36).substring(2, 12).toUpperCase();
    handleChange('barcode', code);
  };
  const generateSku = () => {
    const sku = Math.random().toString(36).substring(2, 10).toUpperCase();
    handleChange('sku', sku);
  };

  // ========== FILES ==========
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, galleryImages: [...prev.galleryImages, ...files] }));
  };
  const removeGalleryImage = (idx) => {
    setFormData(prev => ({ ...prev, galleryImages: prev.galleryImages.filter((_, i) => i !== idx) }));
  };

  const addYouTubeUrl = () => {
    setFormData(prev => ({ ...prev, youtubeUrls: [...prev.youtubeUrls, ''] }));
  };
  const updateYouTubeUrl = (idx, value) => {
    const updated = [...formData.youtubeUrls];
    updated[idx] = value;
    setFormData(prev => ({ ...prev, youtubeUrls: updated }));
  };
  const removeYouTubeUrl = (idx) => {
    const updated = formData.youtubeUrls.filter((_, i) => i !== idx);
    setFormData(prev => ({ ...prev, youtubeUrls: updated }));
  };

  // ========== SAVE PRODUCT – UPDATED TO SEND PACK SIZES ==========
  const buildAttributesPayload = () => {
    const payload = [];
    formData.selectedAttributes.forEach(attrId => {
      const attr = attributeOptions.find(a => a._id === attrId);
      const selectedItems = selectedAttributeValues[attrId] || [];
      if (attr && selectedItems.length) {
        // Convert to format expected by backend: array of objects with value and packSizes
        const valuesWithPackSizes = selectedItems.map(item => ({
          value: item.value,
          packSizes: item.packSizes
        }));
        payload.push({
          name: attr.name,
          values: valuesWithPackSizes
        });
      }
    });
    return payload;
  };

  const saveProduct = async (status) => {
    // Only check required fields (you can remove these checks if you want all optional)
    if (!formData.productName || !formData.mainCategory || !formData.brand) {
      toast.error('Please fill in all required fields (*)');
      return false;
    }
    setSaving(true);
    try {
      const payload = new FormData();

      // ---------- Explicitly append all fields (primitives & files) ----------
      payload.append('productName', formData.productName || '');
      payload.append('mainCategory', formData.mainCategory || '');
      payload.append('brand', formData.brand || '');
      payload.append('unit', formData.unit || '');
      payload.append('weight', formData.weight || 0);
      payload.append('minPurchaseQty', formData.minPurchaseQty || 1);
      payload.append('barcode', formData.barcode || '');
      payload.append('published', status === 'publish' ? true : status === 'unpublish' ? false : false);
      payload.append('featured', formData.featured || false);
      payload.append('todaysDeal', formData.todaysDeal || false);
      payload.append('flashTitle', formData.flashTitle || '');
      payload.append('discount', formData.discount || 0);
      payload.append('discountType', formData.discountType || 'percent');
      payload.append('discountStartDate', formData.discountStartDate || '');
      payload.append('discountEndDate', formData.discountEndDate || '');
      payload.append('refundable', formData.refundable || false);
      payload.append('refundNote', formData.refundNote || '');
      payload.append('warrantyEnabled', formData.warrantyEnabled || false);
      payload.append('warrantyType', formData.warrantyType || '');
      payload.append('warrantyNote', formData.warrantyNote || '');
      payload.append('freeShipping', formData.freeShipping || false);
      payload.append('flatRate', formData.flatRate || false);
      payload.append('quantityMultiply', formData.quantityMultiply || false);
      payload.append('shippingDays', formData.shippingDays || '');
      payload.append('showShippingTime', formData.showShippingTime || false);
      payload.append('showShippingNote', formData.showShippingNote || false);
      payload.append('shippingNote', formData.shippingNote || '');
      payload.append('codAvailable', formData.codAvailable || false);
      payload.append('codNote', formData.codNote || '');
      payload.append('hsnCode', formData.hsnCode || '');
      payload.append('gstRate', formData.gstRate || 0);
      payload.append('metaTitle', formData.metaTitle || '');
      payload.append('metaDescription', formData.metaDescription || '');
      payload.append('unitPrice', formData.unitPrice || 0);
      payload.append('stock', formData.stock || 0);
      payload.append('sku', formData.sku || '');
      payload.append('colorsEnabled', formData.colorsEnabled || false);
      payload.append('colorInput', (formData.selectedColors || []).join(','));
      payload.append('hideStockState', formData.hideStockState || 'none');
      payload.append('lowStockWarning', formData.lowStockWarning || 0);
      payload.append('defaultQuantity', formData.defaultQuantity || 1);

      // Arrays
      (formData.relatedCategories || []).forEach(cat => payload.append('relatedCategories[]', cat));
      (formData.tags || []).forEach(tag => payload.append('tags[]', tag));
      (formData.seoTags || []).forEach(tag => payload.append('seoTags[]', tag));
      (formData.youtubeUrls || []).forEach(url => payload.append('youtubeUrls[]', url));
      (formData.galleryImages || []).forEach(file => payload.append('galleryImages[]', file));
      (formData.selectedAttributes || []).forEach(attrId => payload.append('selectedAttributes[]', attrId));

      // Complex objects
      payload.append('variants', JSON.stringify(formData.variants || []));
      payload.append('frequentlyBought', JSON.stringify(formData.frequentlyBought || []));
      payload.append('attributes', JSON.stringify(buildAttributesPayload()));

      // Files (only if they exist)
      if (formData.thumbnail) payload.append('thumbnail', formData.thumbnail);
      if (formData.videoFile) payload.append('videoFile', formData.videoFile);
      if (formData.videoThumbnail) payload.append('videoThumbnail', formData.videoThumbnail);
      if (formData.pdfSpec) payload.append('pdfSpec', formData.pdfSpec);
      if (formData.metaImage) payload.append('metaImage', formData.metaImage);

      const response = await createProductAPI(payload);
      if (response.success) {
        toast.success(`Product ${status === 'publish' ? 'published' : status === 'unpublish' ? 'unpublished' : 'saved as draft'} successfully!`);
        return true;
      } else {
        toast.error(response.message || 'Failed to save product');
        return false;
      }
    } catch (error) {
      console.error(error);
      toast.error('Network or server error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPublish = () => saveProduct('publish');
  const handleSaveAndUnpublish = () => saveProduct('unpublish');
  const handleSaveAsDraft = () => saveProduct('draft');

  const handleDelete = async () => {
    if (!confirm('Delete this product permanently?')) return;
    setDeleting(true);
    try {
      const response = await deleteProductAPI(formData._id);
      if (response.success) {
        toast.success('Product deleted');
        router.push('/super-admin/product-managment/all-products');
      } else {
        toast.error(response.message || 'Delete failed');
      }
    } catch (error) {
      toast.error('Server error');
    } finally {
      setDeleting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="add-product-page text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading data...</p>
      </div>
    );
  }

  // Prepare options for react-select (attribute names)
  const attributeSelectOptions = attributeOptions.map(attr => ({
    value: attr._id,
    label: attr.name
  }));

  const selectedAttributeOptions = attributeSelectOptions.filter(opt =>
    formData.selectedAttributes.includes(opt.value)
  );

  // For colors, selected options
  const selectedColorOptions = colorSelectOptions.filter(opt =>
    formData.selectedColors.includes(opt.value)
  );

  // For related categories
  const selectedCategoryOptions = categorySelectOptions.filter(opt =>
    formData.relatedCategories.includes(opt.value)
  );

  // Custom Option component for color swatch
  const ColorOption = (props) => {
    const { data, innerProps, isSelected } = props;
    return (
      <div {...innerProps} style={{ display: 'flex', alignItems: 'center', padding: '5px 10px', cursor: 'pointer', backgroundColor: isSelected ? '#e0e0e0' : 'transparent' }}>
        <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: data.colorCode, marginRight: '10px', borderRadius: '3px', border: '1px solid #ccc' }}></span>
        <span>{data.label}</span>
      </div>
    );
  };

  return (
    <div className="add-product-page">
      <Toaster position="top-right" />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title">Add New Product</h1>
        <div className="d-flex gap-2">
          <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete Product'}</button>
          <button type="submit" form="productForm" className="btn-save" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
        </div>
      </div>

      <form id="productForm" className="row g-4">
        {/* LEFT COLUMN */}
        <div className="col-md-6">
          {/* Product Basic Information */}
          <div className="form-card auto-height-card">
            <div className="card-header">Product Basic Information</div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Product Name *</label>
                <input type="text" className="form-control" value={formData.productName} onChange={e => handleChange('productName', e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label">Select Main Category *</label>
                <select className="form-select" value={formData.mainCategory} onChange={e => handleChange('mainCategory', e.target.value)}>
                  <option value="">Select Main Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Brand / Manufacturer *</label>
                <select className="form-select" value={formData.brand} onChange={e => handleChange('brand', e.target.value)}>
                  <option value="">Select Brand</option>
                  {brands.map(b => (
                    <option key={b._id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Product Configuration */}
          <div className="form-card">
            <div className="card-header">Product Configuration</div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Related Categories *</label>
                <Select
                  isMulti
                  options={categorySelectOptions}
                  value={selectedCategoryOptions}
                  onChange={handleRelatedCategoriesChange}
                  placeholder="Select related categories..."
                  classNamePrefix="react-select"
                />
                <small className="text-muted">Select one or more related categories</small>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6"><label className="form-label">Unit *</label><input type="text" className="form-control" placeholder="e.g., Tablet, Bottle" value={formData.unit} onChange={e => handleChange('unit', e.target.value)} /></div>
                <div className="col-6"><label className="form-label">Weight (In Kg)</label><input type="number" step="0.01" className="form-control" value={formData.weight} onChange={e => handleChange('weight', e.target.value)} /></div>
              </div>
              <div className="mb-3"><label className="form-label">Minimum Purchase Qty *</label><input type="number" min="1" className="form-control" value={formData.minPurchaseQty} onChange={e => handleChange('minPurchaseQty', e.target.value)} /></div>
              <div className="mb-3">
                <label className="form-label">Barcode</label>
                <div className="input-group">
                  <input type="text" className="form-control" value={formData.barcode} onChange={e => handleChange('barcode', e.target.value)} placeholder="Enter barcode or generate" />
                  <button type="button" className="btn btn-outline-secondary" onClick={generateBarcode}>Generate</button>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Tags *</label>
                <div className="tag-input-container">
                  {formData.tags.map(tag => (
                    <span key={tag} className="tag">{tag} <i className="bi bi-x-circle" onClick={() => removeTag(tag)}></i></span>
                  ))}
                  <input type="text" className="tag-input" placeholder="Type and hit enter to add a tag" value={formData.tagInput} onChange={e => handleChange('tagInput', e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                </div>
                <small className="text-muted">These keywords help customers find the product via search.</small>
              </div>
            </div>
          </div>

          {/* Files & Media */}
          <div className="form-card">
            <div className="card-header">Files & Media</div>
            <div className="card-body">
              <div className="mb-3"><label className="form-label">Thumbnail</label><input type="file" className="form-control" accept="image/*" onChange={e => handleChange('thumbnail', e.target.files[0])} /><small>300x300px</small></div>
              <div className="mb-3"><label className="form-label">Gallery Images</label><input type="file" className="form-control" multiple accept="image/*" onChange={handleGalleryChange} /><small>800x800px</small>
                {formData.galleryImages.length > 0 && (<div className="gallery-preview mt-2">{formData.galleryImages.map((img, idx) => (<div key={idx} className="gallery-item" style={{ backgroundImage: `url(${URL.createObjectURL(img)})` }} onClick={() => removeGalleryImage(idx)}><i className="bi bi-trash"></i></div>))}</div>)}
              </div>
              <div className="mb-3"><label className="form-label">YouTube link</label>
                {formData.youtubeUrls.map((url, idx) => (
                  <div key={idx} className="input-group mb-2">
                    <input type="url" className="form-control" placeholder="Paste url" value={url} onChange={e => updateYouTubeUrl(idx, e.target.value)} />
                    {formData.youtubeUrls.length > 1 && <button type="button" className="btn btn-outline-danger" onClick={() => removeYouTubeUrl(idx)}><i className="bi bi-trash"></i></button>}
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addYouTubeUrl}>+ Add Another</button>
              </div>
              <div className="mb-3"><label className="form-label">Video file</label><input type="file" className="form-control" accept="video/*" onChange={e => handleChange('videoFile', e.target.files[0])} /><small className="text-muted">Under 30s for better performance</small></div>
              <div className="mb-3"><label className="form-label">Video Thumbnail</label><input type="file" className="form-control" accept="image/*" onChange={e => handleChange('videoThumbnail', e.target.files[0])} /><small className="text-muted">Upload if you want to set video thumb manually</small></div>
              <div className="mb-3"><label className="form-label">PDF Specification</label><input type="file" className="form-control" accept=".pdf" onChange={e => handleChange('pdfSpec', e.target.files[0])} /></div>
            </div>
          </div>

          {/* SEO Meta Tags */}
          <div className="form-card">
            <div className="card-header">SEO Meta Tags</div>
            <div className="card-body">
              <div className="mb-3"><label className="form-label">Meta Title</label><input type="text" className="form-control" value={formData.metaTitle} onChange={e => handleChange('metaTitle', e.target.value)} /></div>
              <div className="mb-3"><label className="form-label">Description</label><textarea rows="3" className="form-control" value={formData.metaDescription} onChange={e => handleChange('metaDescription', e.target.value)} /></div>
              <div className="mb-3"><label className="form-label">Meta Image</label><input type="file" className="form-control" accept="image/*" onChange={e => handleChange('metaImage', e.target.files[0])} /></div>
              <div className="mb-3"><label className="form-label">Tags</label>
                <div className="tag-input-container">
                  {formData.seoTags.map(tag => (<span key={tag} className="tag">{tag} <i className="bi bi-x-circle" onClick={() => removeSeoTag(tag)}></i></span>))}
                  <input type="text" className="tag-input" placeholder="Type and hit enter" value={formData.seoTagInput} onChange={e => handleChange('seoTagInput', e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSeoTag())} />
                </div>
              </div>
            </div>
          </div>

          {/* Product price + stock */}
          <div className="form-card">
            <div className="card-header">Product price + stock</div>
            <div className="card-body">
              <div className="row g-2">
                <div className="col-12"><label className="form-label">Unit price * (₹)</label><input type="number" className="form-control" value={formData.unitPrice} onChange={e => handleChange('unitPrice', e.target.value)} /></div>
                <div className="col-6"><label className="form-label">Discount</label><input type="number" className="form-control" value={formData.discount} onChange={e => handleChange('discount', e.target.value)} /></div>
                <div className="col-6"><label className="form-label">Discount Type</label><select className="form-select" value={formData.discountType} onChange={e => handleChange('discountType', e.target.value)}><option value="percent">Percent</option><option value="fixed">Fixed</option></select></div>
                <div className="col-6"><label className="form-label">Discount Start Date</label><input type="date" className="form-control" value={formData.discountStartDate} onChange={e => handleChange('discountStartDate', e.target.value)} /></div>
                <div className="col-6"><label className="form-label">Discount End Date</label><input type="date" className="form-control" value={formData.discountEndDate} onChange={e => handleChange('discountEndDate', e.target.value)} /></div>
                <div className="col-12"><label className="form-label">Stock</label><input type="number" className="form-control" value={formData.stock} onChange={e => handleChange('stock', e.target.value)} /></div>
                <div className="col-12"><label className="form-label">SKU</label><div className="input-group"><input type="text" className="form-control" value={formData.sku} onChange={e => handleChange('sku', e.target.value)} placeholder="SKU" /><button type="button" className="btn btn-outline-secondary" onClick={generateSku}>Generate</button></div></div>
              </div>
            </div>
          </div>

          {/* ========== COLOR SELECTION CARD – react‑select with swatch ========== */}
          <div className="form-card">
            <div className="card-header">Colors</div>
            <div className="card-body">
              <div className="toggle-item">
                <label className="toggle-switch">
                  <input type="checkbox" checked={formData.colorsEnabled} onChange={e => {
                    handleChange('colorsEnabled', e.target.checked);
                    if (!e.target.checked) setFormData(prev => ({ ...prev, selectedColors: [] }));
                  }} />
                  <span className="toggle-slider"></span>
                </label>
                <span className="toggle-label">Enable Color Variation</span>
              </div>

              {formData.colorsEnabled && (
                <div className="mt-2">
                  <label className="form-label">Select Colors *</label>
                  <Select
                    isMulti
                    options={colorSelectOptions}
                    value={selectedColorOptions}
                    onChange={handleColorSelectChange}
                    placeholder="Select colors..."
                    classNamePrefix="react-select"
                    components={{ Option: ColorOption }}
                  />
                  <small className="text-muted">Choose one or more colors – variants will be created automatically</small>
                </div>
              )}
            </div>
          </div>

          {/* ========== ATTRIBUTES SECTION – ENHANCED WITH PACK SIZES ========== */}
          <div className="form-card">
            <div className="card-header">Attributes</div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Choose attributes for this product</label>
                <Select
                  isMulti
                  options={attributeSelectOptions}
                  value={selectedAttributeOptions}
                  onChange={handleAttributeSelectChange}
                  placeholder="Select attributes..."
                  classNamePrefix="react-select"
                />
                <small className="text-muted">e.g., Size, Fabric, Liter, Sleeve, Storage</small>
              </div>

              {formData.selectedAttributes.map(attrId => {
                const attr = attributeOptions.find(a => a._id === attrId);
                if (!attr) return null;
                
                // Prepare options for attribute values (each value is an object with value and packSizes)
                const valueOptions = (attr.values || []).map(val => {
                  const valueText = typeof val === 'string' ? val : val.value;
                  return { value: valueText, label: valueText };
                });
                
                const selectedItems = selectedAttributeValues[attrId] || [];
                const selectedValueOptions = selectedItems.map(item => ({ value: item.value, label: item.value }));
                
                return (
                  <div key={attrId} className="mb-3 border p-3 rounded">
                    <label className="form-label fw-bold">{attr.name}</label>
                    <Select
                      isMulti
                      options={valueOptions}
                      value={selectedValueOptions}
                      onChange={(selected) => handleAttributeValueChange(attrId, selected)}
                      placeholder={`Select ${attr.name} values...`}
                      classNamePrefix="react-select"
                    />
                    
                    {/* For each selected value, show pack sizes multi-select */}
                    {selectedItems.map((item, idx) => {
                      // Find the original attribute value object to get its packSizes list
                      const originalVal = attr.values.find(v => (typeof v === 'string' ? v : v.value) === item.value);
                      const availablePackSizes = originalVal && typeof originalVal === 'object' && originalVal.packSizes 
                        ? originalVal.packSizes 
                        : [];
                      const packOptions = availablePackSizes.map(p => ({ value: p, label: p }));
                      const selectedPackOptions = (item.packSizes || []).map(p => ({ value: p, label: p }));
                      
                      return (
                        <div key={idx} className="mt-3 pt-2 border-top">
                          <label className="form-label">Pack sizes for <strong>{item.value}</strong></label>
                          <Select
                            isMulti
                            options={packOptions}
                            value={selectedPackOptions}
                            onChange={(selected) => handlePackSizesChange(attrId, item.value, selected)}
                            placeholder={`Select pack sizes for ${item.value}...`}
                            classNamePrefix="react-select"
                          />
                          <small className="text-muted">Choose one or more pack sizes (if any)</small>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Variants Table – shown automatically when variants exist */}
          {formData.variants.length > 0 && (
            <div className="form-card">
              <div className="card-header">Product Variants</div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-bordered align-middle">
                    <thead>
                      <tr><th>Variant</th><th>Price (₹)</th><th>SKU</th><th>Quantity</th><th>Photo</th></tr>
                    </thead>
                    <tbody>
                      {formData.variants.map((variant, idx) => (
                        <tr key={idx}>
                          <td>{variant.variant}</td>
                          <td><input type="number" className="form-control" value={variant.price} onChange={e => updateVariant(idx, 'price', parseFloat(e.target.value))} /></td>
                          <td><input type="text" className="form-control" value={variant.sku} onChange={e => updateVariant(idx, 'sku', e.target.value)} /></td>
                          <td><input type="number" className="form-control" value={variant.quantity} onChange={e => updateVariant(idx, 'quantity', parseInt(e.target.value))} /></td>
                          <td><input type="file" className="form-control" accept="image/*" onChange={e => updateVariant(idx, 'photo', e.target.files[0])} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (unchanged) */}
        <div className="col-md-6">
          <div className="form-card">
            <div className="card-header">Product Settings</div>
            <div className="card-body">
              <div className="toggle-item"><label className="toggle-switch"><input type="checkbox" checked={formData.published} onChange={e => handleChange('published', e.target.checked)} /><span className="toggle-slider"></span></label><span className="toggle-label">Published</span></div>
              <div className="toggle-item"><label className="toggle-switch"><input type="checkbox" checked={formData.featured} onChange={e => handleChange('featured', e.target.checked)} /><span className="toggle-slider"></span></label><span className="toggle-label">Featured</span></div>
              <div className="toggle-item"><label className="toggle-switch"><input type="checkbox" checked={formData.todaysDeal} onChange={e => handleChange('todaysDeal', e.target.checked)} /><span className="toggle-slider"></span></label><span className="toggle-label">Today's Deal</span></div>
            </div>
          </div>

          <div className="form-card">
            <div className="card-header">Flash Sale</div>
            <div className="card-body">
              <div className="mb-3"><label className="form-label">Choose Flash Title</label><select className="form-select" value={formData.flashTitle} onChange={e => handleChange('flashTitle', e.target.value)}><option value="">Select Flash Title</option><option>Flash Sale</option><option>Flash Deal</option><option>Electronic</option><option>Winter Sale</option></select></div>
              <div className="row g-2">
                <div className="col-6"><label className="form-label">Discount</label><input type="number" className="form-control" value={formData.discount} onChange={e => handleChange('discount', e.target.value)} /></div>
                <div className="col-6"><label className="form-label">Discount Type</label><select className="form-select" value={formData.discountType} onChange={e => handleChange('discountType', e.target.value)}><option value="percent">Percent</option><option value="fixed">Fixed</option></select></div>
                <div className="col-6"><label className="form-label">Start Date</label><input type="date" className="form-control" value={formData.discountStartDate} onChange={e => handleChange('discountStartDate', e.target.value)} /></div>
                <div className="col-6"><label className="form-label">End Date</label><input type="date" className="form-control" value={formData.discountEndDate} onChange={e => handleChange('discountEndDate', e.target.value)} /></div>
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="card-header">Refund</div>
            <div className="card-body">
              <div className="toggle-item"><label className="toggle-switch"><input type="checkbox" checked={formData.refundable} onChange={e => handleChange('refundable', e.target.checked)} /><span className="toggle-slider"></span></label><span className="toggle-label">Refundable</span></div>
              <div className="text-muted mb-2" style={{ fontSize: '0.8rem' }}>Show notes in refund section</div>
              <div><label className="form-label">Note (Add from preset)</label><div className="preset-note-box"><p className="mb-0">{formData.refundNote}</p></div><button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={() => router.push('/super-admin/product-managment/product-setup/notes/addNote')}>+ Add New Preset</button></div>
            </div>
          </div>

          <div className="form-card">
            <div className="card-header">Warranty</div>
            <div className="card-body">
              <div className="toggle-item">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.warrantyEnabled}
                    onChange={e => handleChange('warrantyEnabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="toggle-label">Enable warranty</span>
              </div>

              <div className="mt-2">
                <label className="form-label">Select Warranty</label>
                <select
                  className="form-select"
                  value={formData.warrantyType}
                  onChange={e => handleChange('warrantyType', e.target.value)}
                >
                  <option value="">Select Warranty</option>
                  {warranties.map(w => (
                    <option key={w._id} value={w.name}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="text-muted mb-2 mt-2">Show notes in warranty section</div>

              <div>
                <label className="form-label">Notes (Add from Preset)</label>
                <div className="preset-note-box">
                  <p className="mb-0">{formData.warrantyNote}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary mt-2"
                  onClick={() =>
                    router.push(
                      '/super-admin/product-managment/product-setup/notes/addNote?type=Warranty'
                    )
                  }
                >
                  + Add New Notes
                </button>
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="card-header">Shipping</div>
            <div className="card-body">
              <div className="mb-3"><label className="form-label fw-bold">Shipping Configuration</label>
                <div className="form-check"><input className="form-check-input" type="checkbox" checked={formData.freeShipping} onChange={e => handleChange('freeShipping', e.target.checked)} /><label className="form-check-label">Free Shipping</label></div>
                <div className="form-check"><input className="form-check-input" type="checkbox" checked={formData.flatRate} onChange={e => handleChange('flatRate', e.target.checked)} /><label className="form-check-label">Flat Rate</label></div>
                <div className="form-check"><input className="form-check-input" type="checkbox" checked={formData.quantityMultiply} onChange={e => handleChange('quantityMultiply', e.target.checked)} /><label className="form-check-label">Is Product Quantity Multiply</label></div>
              </div>
              <div className="mb-3"><label className="form-label fw-bold">Estimated Shipping Time</label>
                <div className="mb-2"><label className="form-label">Shipping Days</label><input type="text" className="form-control" placeholder="e.g., 7-15 days" value={formData.shippingDays} onChange={e => handleChange('shippingDays', e.target.value)} /></div>
                <div className="form-check"><input className="form-check-input" type="checkbox" checked={formData.showShippingTime} onChange={e => handleChange('showShippingTime', e.target.checked)} /><label className="form-check-label">Show estimated shipping time in product description page</label></div>
                <div className="form-check"><input className="form-check-input" type="checkbox" checked={formData.showShippingNote} onChange={e => handleChange('showShippingNote', e.target.checked)} /><label className="form-check-label">Show notes in shipping time section</label></div>
              </div>
              <div><label className="form-label">Notes (Add from Preset)</label><div className="preset-note-box"><p className="mb-0">{formData.shippingNote}</p></div><button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={() => router.push('/super-admin/product-managment/product-setup/notes/addNote')}>+ Add New Notes</button></div>
            </div>
          </div>

          <div className="form-card">
            <div className="card-header">Cash on Delivery</div>
            <div className="card-body">
              <div className="toggle-item"><label className="toggle-switch"><input type="checkbox" checked={formData.codAvailable} onChange={e => handleChange('codAvailable', e.target.checked)} /><span className="toggle-slider"></span></label><span className="toggle-label">Cash on delivery available</span></div>
              <div className="text-muted mb-2">Show notes in cash on delivery section</div>
              <div><label className="form-label">Notes (Add from Preset)</label><div className="preset-note-box"><p className="mb-0">{formData.codNote}</p></div><button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={() => router.push('/super-admin/product-managment/cod-presets')}>+ Add New Preset</button></div>
            </div>
          </div>

          <div className="form-card">
            <div className="card-header">HSN & GST</div>
            <div className="card-body">
              <div className="mb-3"><label className="form-label">HSN Code</label><input type="text" className="form-control" value={formData.hsnCode} onChange={e => handleChange('hsnCode', e.target.value)} /></div>
              <div className="mb-3"><label className="form-label">GST Rate (%)</label><input type="number" step="0.01" className="form-control" value={formData.gstRate} onChange={e => handleChange('gstRate', e.target.value)} /></div>
            </div>
          </div>

          <div className="form-card">
            <div className="card-header">Stock & Order Display Settings</div>
            <div className="card-body">
              <div className="mb-3"><label className="form-label fw-bold">Hide Stock Visibility State</label>
                <div className="form-check"><input className="form-check-input" type="radio" name="hideStockState" value="none" checked={formData.hideStockState === 'none'} onChange={e => handleChange('hideStockState', e.target.value)} /><label>Show Stock Quantity</label></div>
                <div className="form-check"><input className="form-check-input" type="radio" name="hideStockState" value="text_only" checked={formData.hideStockState === 'text_only'} onChange={e => handleChange('hideStockState', e.target.value)} /><label>Show Stock With Text Only</label></div>
              </div>
              <div className="mb-3"><label className="form-label">Low Stock Quantity Warning</label><input type="number" className="form-control" value={formData.lowStockWarning} onChange={e => handleChange('lowStockWarning', parseInt(e.target.value))} /></div>
              <div className="mb-3"><label className="form-label">Quantity (default in cart)</label><input type="number" className="form-control" value={formData.defaultQuantity} onChange={e => handleChange('defaultQuantity', parseInt(e.target.value))} /></div>
            </div>
          </div>

          <div className="form-card">
            <div className="card-header">Frequently Bought</div>
            <div className="card-body">
              {formData.frequentlyBought.map((item, idx) => (
                <div key={idx} className="row g-2 mb-2 align-items-end">
                  <div className="col-5"><select className="form-select" value={item.product} onChange={e => updateFrequentlyBought(idx, 'product', e.target.value)}><option value="">Select Product</option><option>Paracetamol 500mg</option><option>Vitamin C Tablets</option></select></div>
                  <div className="col-5"><select className="form-select" value={item.category} onChange={e => updateFrequentlyBought(idx, 'category', e.target.value)}><option value="">Select Category</option><option>Medicine</option><option>Supplements</option></select></div>
                  <div className="col-2">{formData.frequentlyBought.length > 1 && <button type="button" className="btn btn-sm btn-danger" onClick={() => removeFrequentlyBought(idx)}>Remove</button>}</div>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={addFrequentlyBought}>+ Add More</button>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4 mb-5">
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
          <button type="button" className="btn-save" onClick={handleSaveAndUnpublish} disabled={saving}>{saving ? 'Saving...' : 'Save & Unpublish'}</button>
          <button type="button" className="btn-save" onClick={handleSaveAndPublish} disabled={saving}>{saving ? 'Saving...' : 'Save & Publish'}</button>
          <button type="button" className="btn-save" onClick={handleSaveAsDraft} disabled={saving}>{saving ? 'Saving...' : 'Save As Draft'}</button>
        </div>
      </form>
    </div>
  );
}