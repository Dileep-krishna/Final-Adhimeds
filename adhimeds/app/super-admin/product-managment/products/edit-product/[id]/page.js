'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Select from 'react-select';

import './edit-product.css';

import { getAttributesAPI } from '../../../../../services/attributeAPI';
import { getColorsAPI } from '../../../../../services/colorAPI';
import { getWarrantiesAPI } from '../../../../../services/warrentyAPI';
import { getCategoriesAPI } from '../../../../../services/categoryAPI';
import { getAllBrands } from '../../../../../services/brandAPI';
import { getProductByIdAPI, updateProductAPI } from '../../../../../services/productService';
import SERVERURL from '../../../../../services/serverURL';

export const runtime = 'nodejs'; // optional, but ensures Node.js runtime
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  // ========== DYNAMIC DROPDOWN DATA ==========
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [attributeOptions, setAttributeOptions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  // Store selected attribute values with pack sizes: { [attrId]: [{ value, packSizes: [] }] }
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

  // Existing image previews
  const [existingThumbnail, setExistingThumbnail] = useState('');
  const [existingMetaImage, setExistingMetaImage] = useState('');
  const [existingGalleryImages, setExistingGalleryImages] = useState([]);
  const [existingReviewerImageUrl, setExistingReviewerImageUrl] = useState('');
  const [existingReviewImages, setExistingReviewImages] = useState([]);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const getImageUrl = (filename) => filename ? `${SERVERURL}/imgUploads/${filename}` : '';

  // Helper to parse API response arrays
  const extractDataArray = (response) => {
    if (Array.isArray(response)) return response;
    if (response?.data && Array.isArray(response.data)) return response.data;
    if (response?.success && Array.isArray(response.data)) return response.data;
    return [];
  };

  // Fetch all dropdown data
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
        const mappedWarranties = rawWarranties.map(w => ({ ...w, name: w.text || w.name || 'Unnamed' }));
        setWarranties(mappedWarranties);
        setColorOptions(extractDataArray(colorRes));
        const attributes = extractDataArray(attrRes);
        setAttributeOptions(attributes);
        // Initialize empty selections for all attributes
        const initialSelections = {};
        attributes.forEach(attr => { initialSelections[attr._id] = []; });
        setSelectedAttributeValues(initialSelections);
      } catch (error) {
        console.error('Error loading dropdown data:', error);
        toast.error('Failed to load dropdown data');
      } finally {
        setLoadingData(false);
      }
    };
    fetchDropdownData();
  }, []);

  // Fetch product data
  useEffect(() => {
    if (!id) {
      toast.error('Invalid product ID');
      router.push('/super-admin/product-managment/products/all-product');
      return;
    }
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await getProductByIdAPI(id);
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
            unitPrice: p.unitPrice || 0,
            stock: p.stock || 0,
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

          // ✅ Populate selected attribute values (with pack sizes) from product data
          if (p.attributes && p.attributes.length) {
            const attrSelections = {};
            p.attributes.forEach(attr => {
              const foundAttr = attributeOptions.find(a => a.name === attr.name);
              if (foundAttr) {
                // attr.values can be either array of strings (old) or array of { value, packSizes }
                const valuesWithPackSizes = attr.values.map(v => {
                  if (typeof v === 'string') {
                    return { value: v, packSizes: [] };
                  } else {
                    return { value: v.value, packSizes: v.packSizes || [] };
                  }
                });
                attrSelections[foundAttr._id] = valuesWithPackSizes;
              }
            });
            setSelectedAttributeValues(attrSelections);
          }
        } else {
          toast.error(res.message || 'Product not found');
          router.push('/super-admin/product-managment/products/all-product');
        }
      } catch (error) {
        console.error(error);
        toast.error('Server error loading product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, router, attributeOptions]);

  // Compute variants from selected colors
  const computeVariants = () => {
    const colors = formData.colorsEnabled ? formData.selectedColors : [];
    if (colors.length === 0) return [];
    return colors.map(color => ({
      variant: color,
      price: formData.unitPrice,
      sku: color.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      quantity: 0,
      photo: null,
    }));
  };
  useEffect(() => {
    if (formData.colorsEnabled) {
      setFormData(prev => ({ ...prev, variants: computeVariants() }));
    } else {
      setFormData(prev => ({ ...prev, variants: [] }));
    }
  }, [formData.colorsEnabled, formData.selectedColors, formData.unitPrice]);

  // Handlers
  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const addTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, prev.tagInput.trim()], tagInput: '' }));
    }
  };
  const removeTag = (tag) => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));

  const addSeoTag = () => {
    if (formData.seoTagInput.trim() && !formData.seoTags.includes(formData.seoTagInput.trim())) {
      setFormData(prev => ({ ...prev, seoTags: [...prev.seoTags, prev.seoTagInput.trim()], seoTagInput: '' }));
    }
  };
  const removeSeoTag = (tag) => setFormData(prev => ({ ...prev, seoTags: prev.seoTags.filter(t => t !== tag) }));

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, galleryImages: [...prev.galleryImages, ...files] }));
  };
  const removeGalleryImage = (idx) => {
    setFormData(prev => ({ ...prev, galleryImages: prev.galleryImages.filter((_, i) => i !== idx) }));
  };

  const addYouTubeUrl = () => setFormData(prev => ({ ...prev, youtubeUrls: [...prev.youtubeUrls, ''] }));
  const updateYouTubeUrl = (idx, val) => {
    const updated = [...formData.youtubeUrls];
    updated[idx] = val;
    setFormData(prev => ({ ...prev, youtubeUrls: updated }));
  };
  const removeYouTubeUrl = (idx) => {
    setFormData(prev => ({ ...prev, youtubeUrls: prev.youtubeUrls.filter((_, i) => i !== idx) }));
  };

  const addFrequentlyBought = () => setFormData(prev => ({ ...prev, frequentlyBought: [...prev.frequentlyBought, { product: '', category: '' }] }));
  const updateFrequentlyBought = (idx, field, value) => {
    const updated = [...formData.frequentlyBought];
    updated[idx][field] = value;
    setFormData(prev => ({ ...prev, frequentlyBought: updated }));
  };
  const removeFrequentlyBought = (idx) => setFormData(prev => ({ ...prev, frequentlyBought: prev.frequentlyBought.filter((_, i) => i !== idx) }));

  // React-Select options
  const categorySelectOptions = categories.map(cat => ({ value: cat.name, label: cat.name }));
  const selectedCategoryOptions = categorySelectOptions.filter(opt => formData.relatedCategories.includes(opt.value));

  const colorSelectOptions = colorOptions.map(c => ({ value: c.name, label: c.name, colorCode: c.code }));
  const selectedColorOptions = colorSelectOptions.filter(opt => formData.selectedColors.includes(opt.value));

  const attributeSelectOptions = attributeOptions.map(attr => ({ value: attr._id, label: attr.name }));
  const selectedAttributeOptions = attributeSelectOptions.filter(opt => formData.selectedAttributes.includes(opt.value));

  const ColorOption = (props) => {
    const { data, innerProps, isSelected } = props;
    return (
      <div {...innerProps} style={{ display: 'flex', alignItems: 'center', padding: '5px 10px', cursor: 'pointer', backgroundColor: isSelected ? '#e0e0e0' : 'transparent' }}>
        <span style={{ display: 'inline-block', width: 20, height: 20, backgroundColor: data.colorCode, marginRight: 10, borderRadius: 3, border: '1px solid #ccc' }}></span>
        <span>{data.label}</span>
      </div>
    );
  };

  // Build attributes payload with pack sizes
  const buildAttributesPayload = () => {
    const payload = [];
    formData.selectedAttributes.forEach(attrId => {
      const attr = attributeOptions.find(a => a._id === attrId);
      const selectedItems = selectedAttributeValues[attrId] || [];
      if (attr && selectedItems.length) {
        payload.push({
          name: attr.name,
          values: selectedItems.map(item => ({
            value: item.value,
            packSizes: item.packSizes
          }))
        });
      }
    });
    return payload;
  };

  // Handle attribute selection change (multi-select for attribute IDs)
  const handleAttributeSelectChange = (selectedOptions) => {
    const selectedIds = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    // Remove any attribute that is no longer selected
    const newSelectedValues = { ...selectedAttributeValues };
    Object.keys(newSelectedValues).forEach(attrId => {
      if (!selectedIds.includes(attrId)) {
        delete newSelectedValues[attrId];
      }
    });
    setSelectedAttributeValues(newSelectedValues);
    handleChange('selectedAttributes', selectedIds);
  };

  // Handle attribute value selection (with pack sizes initially empty)
  const handleAttributeValueChange = (attrId, selectedOptions) => {
    const selectedValues = selectedOptions ? selectedOptions.map(opt => ({
      value: opt.value,
      packSizes: []
    })) : [];
    setSelectedAttributeValues(prev => ({ ...prev, [attrId]: selectedValues }));
  };

  // Handle pack sizes selection for a specific attribute value
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mandatory fields
    if (!formData.productName || !formData.mainCategory || !formData.brand) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const payload = new FormData();
      // Append all primitive fields
      Object.entries(formData).forEach(([key, val]) => {
        if (['thumbnail', 'metaImage', 'galleryImages', 'youtubeUrls', 'tags', 'seoTags', 'relatedCategories', 'selectedColors', 'selectedAttributes', 'variants', 'frequentlyBought', 'tagInput', 'seoTagInput', 'videoFile', 'videoThumbnail', 'pdfSpec'].includes(key)) return;
        if (val !== undefined && val !== null) payload.append(key, val);
      });
      // Arrays
      formData.relatedCategories.forEach(c => payload.append('relatedCategories[]', c));
      formData.tags.forEach(t => payload.append('tags[]', t));
      formData.seoTags.forEach(t => payload.append('seoTags[]', t));
      formData.youtubeUrls.forEach(url => payload.append('youtubeUrls[]', url));
      formData.selectedAttributes.forEach(attrId => payload.append('selectedAttributes[]', attrId));
      formData.selectedColors.forEach(col => payload.append('selectedColors[]', col));
      payload.append('variants', JSON.stringify(formData.variants));
      payload.append('frequentlyBought', JSON.stringify(formData.frequentlyBought));
      payload.append('attributes', JSON.stringify(buildAttributesPayload()));
      // Files
      if (formData.thumbnail) payload.append('thumbnail', formData.thumbnail);
      if (formData.metaImage) payload.append('metaImage', formData.metaImage);
      formData.galleryImages.forEach(file => payload.append('galleryImages[]', file));
      if (formData.videoFile) payload.append('videoFile', formData.videoFile);
      if (formData.videoThumbnail) payload.append('videoThumbnail', formData.videoThumbnail);
      if (formData.pdfSpec) payload.append('pdfSpec', formData.pdfSpec);
      // Existing images to keep (optional)
      if (existingThumbnail) payload.append('existingThumbnail', existingThumbnail);
      if (existingMetaImage) payload.append('existingMetaImage', existingMetaImage);
      existingGalleryImages.forEach(img => payload.append('existingGalleryImages[]', img));

      const res = await updateProductAPI(id, payload);
      if (res.success) {
        toast.success('Product updated successfully');
        router.push('/super-admin/product-managment/products/all-product');
      } else {
        toast.error(res.message || 'Update failed');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error while updating');
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingData) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

  return (
    <div className="add-product-page"> {/* reuse same CSS class */}
      <Toaster position="top-right" />
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="page-title">Edit Product</h1>
          <div className="d-flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
            <button type="submit" form="editProductForm" className="btn-save" disabled={saving}>
              {saving ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </div>

        <form id="editProductForm" className="row g-4" onSubmit={handleSubmit}>
          {/* LEFT COLUMN */}
          <div className="col-md-6">
            {/* Basic Info */}
            <div className="form-card">
              <div className="card-header">Product Basic Information</div>
              <div className="card-body">
                <div className="mb-3"><label className="form-label">Product Name *</label><input type="text" className="form-control" value={formData.productName} onChange={e => handleChange('productName', e.target.value)} required /></div>
                <div className="mb-3"><label className="form-label">Select Main Category *</label><select className="form-select" value={formData.mainCategory} onChange={e => handleChange('mainCategory', e.target.value)} required><option value="">Select Main Category</option>{categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}</select></div>
                <div className="mb-3"><label className="form-label">Brand / Manufacturer *</label><select className="form-select" value={formData.brand} onChange={e => handleChange('brand', e.target.value)} required><option value="">Select Brand</option>{brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}</select></div>
              </div>
            </div>

            {/* Configuration */}
            <div className="form-card">
              <div className="card-header">Product Configuration</div>
              <div className="card-body">
                <div className="mb-3"><label className="form-label">Related Categories</label><Select isMulti options={categorySelectOptions} value={selectedCategoryOptions} onChange={selected => handleChange('relatedCategories', selected.map(opt => opt.value))} classNamePrefix="react-select" /></div>
                <div className="row g-2 mb-3"><div className="col-6"><label className="form-label">Unit *</label><input type="text" className="form-control" value={formData.unit} onChange={e => handleChange('unit', e.target.value)} placeholder="e.g., Tablet, Bottle" required /></div><div className="col-6"><label className="form-label">Weight (Kg)</label><input type="number" step="0.01" className="form-control" value={formData.weight} onChange={e => handleChange('weight', e.target.value)} /></div></div>
                <div className="mb-3"><label className="form-label">Minimum Purchase Qty *</label><input type="number" min="1" className="form-control" value={formData.minPurchaseQty} onChange={e => handleChange('minPurchaseQty', e.target.value)} required /></div>
                <div className="mb-3"><label className="form-label">Barcode</label><div className="input-group"><input type="text" className="form-control" value={formData.barcode} onChange={e => handleChange('barcode', e.target.value)} /><button type="button" className="btn btn-outline-secondary" onClick={() => handleChange('barcode', Math.random().toString(36).substring(2,12).toUpperCase())}>Generate</button></div></div>
                <div className="mb-3"><label className="form-label">Tags</label><div className="tag-input-container">{formData.tags.map(tag => (<span key={tag} className="tag">{tag} <i className="bi bi-x-circle" onClick={() => removeTag(tag)}></i></span>))}<input type="text" className="tag-input" placeholder="Type and hit enter" value={formData.tagInput} onChange={e => handleChange('tagInput', e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} /></div><small>Keywords help customers find the product</small></div>
              </div>
            </div>

            {/* Files & Media */}
            <div className="form-card">
              <div className="card-header">Files & Media</div>
              <div className="card-body">
                <div className="mb-3"><label className="form-label">Thumbnail</label><input type="file" className="form-control" accept="image/*" onChange={e => handleChange('thumbnail', e.target.files[0])} />{existingThumbnail && <img src={getImageUrl(existingThumbnail)} alt="current" width="80" className="mt-2" />}</div>
                <div className="mb-3"><label className="form-label">Gallery Images</label><input type="file" className="form-control" multiple accept="image/*" onChange={handleGalleryChange} /><div className="gallery-preview mt-2 d-flex flex-wrap gap-2">{existingGalleryImages.map((img, idx) => <img key={idx} src={getImageUrl(img)} width="60" className="border rounded" />)}{formData.galleryImages.map((img, idx) => <div key={idx} className="gallery-item" style={{ backgroundImage: `url(${URL.createObjectURL(img)})` }} onClick={() => removeGalleryImage(idx)}><i className="bi bi-trash"></i></div>)}</div></div>
                <div className="mb-3"><label>YouTube links</label>{formData.youtubeUrls.map((url, idx) => (<div key={idx} className="input-group mb-2"><input type="url" className="form-control" value={url} onChange={e => updateYouTubeUrl(idx, e.target.value)} placeholder="YouTube URL" />{formData.youtubeUrls.length > 1 && <button type="button" className="btn btn-outline-danger" onClick={() => removeYouTubeUrl(idx)}><i className="bi bi-trash"></i></button>}</div>))}<button type="button" className="btn btn-sm btn-outline-secondary" onClick={addYouTubeUrl}>+ Add Another</button></div>
                <div className="mb-3"><label>Video file</label><input type="file" className="form-control" accept="video/*" onChange={e => handleChange('videoFile', e.target.files[0])} /></div>
                <div className="mb-3"><label>Video Thumbnail</label><input type="file" className="form-control" accept="image/*" onChange={e => handleChange('videoThumbnail', e.target.files[0])} /></div>
                <div className="mb-3"><label>PDF Specification</label><input type="file" className="form-control" accept=".pdf" onChange={e => handleChange('pdfSpec', e.target.files[0])} /></div>
              </div>
            </div>

            {/* SEO */}
            <div className="form-card">
              <div className="card-header">SEO Meta Tags</div>
              <div className="card-body">
                <div className="mb-3"><label>Meta Title</label><input type="text" className="form-control" value={formData.metaTitle} onChange={e => handleChange('metaTitle', e.target.value)} /></div>
                <div className="mb-3"><label>Meta Description</label><textarea rows="3" className="form-control" value={formData.metaDescription} onChange={e => handleChange('metaDescription', e.target.value)} /></div>
                <div className="mb-3"><label>Meta Image</label><input type="file" className="form-control" accept="image/*" onChange={e => handleChange('metaImage', e.target.files[0])} />{existingMetaImage && <img src={getImageUrl(existingMetaImage)} width="80" className="mt-2" />}</div>
                <div className="mb-3"><label>SEO Tags</label><div className="tag-input-container">{formData.seoTags.map(tag => (<span key={tag} className="tag">{tag} <i className="bi bi-x-circle" onClick={() => removeSeoTag(tag)}></i></span>))}<input type="text" className="tag-input" placeholder="Type and hit enter" value={formData.seoTagInput} onChange={e => handleChange('seoTagInput', e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSeoTag())} /></div></div>
              </div>
            </div>

            {/* Price & Stock */}
            <div className="form-card">
              <div className="card-header">Product price + stock</div>
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-12"><label className="form-label">Unit price * (₹)</label><input type="number" className="form-control" value={formData.unitPrice} onChange={e => handleChange('unitPrice', e.target.value)} /></div>
                  <div className="col-6"><label>Discount</label><input type="number" className="form-control" value={formData.discount} onChange={e => handleChange('discount', e.target.value)} /></div>
                  <div className="col-6"><label>Discount Type</label><select className="form-select" value={formData.discountType} onChange={e => handleChange('discountType', e.target.value)}><option value="percent">Percent</option><option value="fixed">Fixed</option></select></div>
                  <div className="col-6"><label>Start Date</label><input type="date" className="form-control" value={formData.discountStartDate} onChange={e => handleChange('discountStartDate', e.target.value)} /></div>
                  <div className="col-6"><label>End Date</label><input type="date" className="form-control" value={formData.discountEndDate} onChange={e => handleChange('discountEndDate', e.target.value)} /></div>
                  <div className="col-12"><label>Stock</label><input type="number" className="form-control" value={formData.stock} onChange={e => handleChange('stock', e.target.value)} /></div>
                  <div className="col-12"><label>SKU</label><div className="input-group"><input type="text" className="form-control" value={formData.sku} onChange={e => handleChange('sku', e.target.value)} /><button type="button" className="btn btn-outline-secondary" onClick={() => handleChange('sku', Math.random().toString(36).substring(2,10).toUpperCase())}>Generate</button></div></div>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="form-card">
              <div className="card-header">Colors</div>
              <div className="card-body">
                <div className="toggle-item"><label className="toggle-switch"><input type="checkbox" checked={formData.colorsEnabled} onChange={e => { handleChange('colorsEnabled', e.target.checked); if (!e.target.checked) handleChange('selectedColors', []); }} /><span className="toggle-slider"></span></label><span className="toggle-label">Enable Color Variation</span></div>
                {formData.colorsEnabled && (<div className="mt-2"><label className="form-label">Select Colors</label><Select isMulti options={colorSelectOptions} value={selectedColorOptions} onChange={selected => handleChange('selectedColors', selected.map(opt => opt.value))} classNamePrefix="react-select" components={{ Option: ColorOption }} /><small>Variants will be auto‑generated</small></div>)}
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
                  
                  // Prepare options for attribute values (each value can be string or object)
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

            {/* Variants table */}
            {formData.variants.length > 0 && (<div className="form-card"><div className="card-header">Product Variants</div><div className="card-body"><div className="table-responsive"><table className="table table-bordered"><thead><tr><th>Variant</th><th>Price (₹)</th><th>SKU</th><th>Quantity</th><th>Photo</th></tr></thead><tbody>{formData.variants.map((v, idx) => (<tr key={idx}><td>{v.variant}</td><td><input type="number" className="form-control" value={v.price} onChange={e => { const newVar = [...formData.variants]; newVar[idx].price = parseFloat(e.target.value); setFormData(prev => ({ ...prev, variants: newVar })); }} /></td><td><input type="text" className="form-control" value={v.sku} onChange={e => { const newVar = [...formData.variants]; newVar[idx].sku = e.target.value; setFormData(prev => ({ ...prev, variants: newVar })); }} /></td><td><input type="number" className="form-control" value={v.quantity} onChange={e => { const newVar = [...formData.variants]; newVar[idx].quantity = parseInt(e.target.value); setFormData(prev => ({ ...prev, variants: newVar })); }} /></td><td><input type="file" className="form-control" onChange={e => { const newVar = [...formData.variants]; newVar[idx].photo = e.target.files[0]; setFormData(prev => ({ ...prev, variants: newVar })); }} /></td></tr>))}</tbody></table></div></div></div>)}

          </div>{/* end left column */}

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
                <div className="mb-3"><label>Choose Flash Title</label><select className="form-select" value={formData.flashTitle} onChange={e => handleChange('flashTitle', e.target.value)}><option value="">Select Flash Title</option><option>Flash Sale</option><option>Flash Deal</option></select></div>
                <div className="row g-2"><div className="col-6"><label>Discount</label><input type="number" className="form-control" value={formData.discount} onChange={e => handleChange('discount', e.target.value)} /></div><div className="col-6"><label>Discount Type</label><select className="form-select" value={formData.discountType} onChange={e => handleChange('discountType', e.target.value)}><option value="percent">Percent</option><option value="fixed">Fixed</option></select></div><div className="col-6"><label>Start Date</label><input type="date" className="form-control" value={formData.discountStartDate} onChange={e => handleChange('discountStartDate', e.target.value)} /></div><div className="col-6"><label>End Date</label><input type="date" className="form-control" value={formData.discountEndDate} onChange={e => handleChange('discountEndDate', e.target.value)} /></div></div>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">Refund</div>
              <div className="card-body">
                <div className="toggle-item"><label className="toggle-switch"><input type="checkbox" checked={formData.refundable} onChange={e => handleChange('refundable', e.target.checked)} /><span className="toggle-slider"></span></label><span className="toggle-label">Refundable</span></div>
                <div className="mt-2"><label className="form-label">Refund Note</label><div className="preset-note-box"><p className="mb-0">{formData.refundNote}</p></div></div>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">Warranty</div>
              <div className="card-body">
                <div className="toggle-item"><label className="toggle-switch"><input type="checkbox" checked={formData.warrantyEnabled} onChange={e => handleChange('warrantyEnabled', e.target.checked)} /><span className="toggle-slider"></span></label><span className="toggle-label">Enable warranty</span></div>
                <div className="mt-2"><label className="form-label">Select Warranty</label><select className="form-select" value={formData.warrantyType} onChange={e => handleChange('warrantyType', e.target.value)}><option value="">Select Warranty</option>{warranties.map(w => <option key={w._id} value={w.name}>{w.name}</option>)}</select></div>
                <div className="mt-2"><label className="form-label">Warranty Note</label><div className="preset-note-box"><p className="mb-0">{formData.warrantyNote}</p></div></div>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">Shipping</div>
              <div className="card-body">
                <div className="mb-3"><label className="fw-bold">Shipping Configuration</label><div className="form-check"><input className="form-check-input" type="checkbox" checked={formData.freeShipping} onChange={e => handleChange('freeShipping', e.target.checked)} /><label>Free Shipping</label></div><div className="form-check"><input className="form-check-input" type="checkbox" checked={formData.flatRate} onChange={e => handleChange('flatRate', e.target.checked)} /><label>Flat Rate</label></div><div className="form-check"><input className="form-check-input" type="checkbox" checked={formData.quantityMultiply} onChange={e => handleChange('quantityMultiply', e.target.checked)} /><label>Quantity Multiply</label></div></div>
                <div className="mb-3"><label className="fw-bold">Estimated Shipping Time</label><div className="mb-2"><label>Shipping Days</label><input type="text" className="form-control" placeholder="e.g., 7-15 days" value={formData.shippingDays} onChange={e => handleChange('shippingDays', e.target.value)} /></div><div className="form-check"><input className="form-check-input" type="checkbox" checked={formData.showShippingTime} onChange={e => handleChange('showShippingTime', e.target.checked)} /><label>Show time in PDP</label></div><div className="form-check"><input className="form-check-input" type="checkbox" checked={formData.showShippingNote} onChange={e => handleChange('showShippingNote', e.target.checked)} /><label>Show note in shipping section</label></div></div>
                <div><label className="form-label">Shipping Note</label><div className="preset-note-box"><p className="mb-0">{formData.shippingNote}</p></div></div>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">Cash on Delivery</div>
              <div className="card-body">
                <div className="toggle-item"><label className="toggle-switch"><input type="checkbox" checked={formData.codAvailable} onChange={e => handleChange('codAvailable', e.target.checked)} /><span className="toggle-slider"></span></label><span className="toggle-label">COD available</span></div>
                <div className="mt-2"><label className="form-label">COD Note</label><div className="preset-note-box"><p className="mb-0">{formData.codNote}</p></div></div>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">HSN & GST</div>
              <div className="card-body"><div className="mb-3"><label>HSN Code</label><input type="text" className="form-control" value={formData.hsnCode} onChange={e => handleChange('hsnCode', e.target.value)} /></div><div className="mb-3"><label>GST Rate (%)</label><input type="number" step="0.01" className="form-control" value={formData.gstRate} onChange={e => handleChange('gstRate', e.target.value)} /></div></div>
            </div>

            <div className="form-card">
              <div className="card-header">Stock & Order Display</div>
              <div className="card-body"><div className="mb-3"><label className="fw-bold">Hide Stock Visibility</label><div className="form-check"><input className="form-check-input" type="radio" name="hideStockState" value="none" checked={formData.hideStockState === 'none'} onChange={e => handleChange('hideStockState', e.target.value)} /><label>Show Stock Quantity</label></div><div className="form-check"><input className="form-check-input" type="radio" name="hideStockState" value="text_only" checked={formData.hideStockState === 'text_only'} onChange={e => handleChange('hideStockState', e.target.value)} /><label>Show Stock With Text Only</label></div></div><div className="mb-3"><label>Low Stock Warning</label><input type="number" className="form-control" value={formData.lowStockWarning} onChange={e => handleChange('lowStockWarning', parseInt(e.target.value))} /></div><div className="mb-3"><label>Default Quantity in Cart</label><input type="number" className="form-control" value={formData.defaultQuantity} onChange={e => handleChange('defaultQuantity', parseInt(e.target.value))} /></div></div>
            </div>

            <div className="form-card">
              <div className="card-header">Frequently Bought</div>
              <div className="card-body">
                {formData.frequentlyBought.map((item, idx) => (<div key={idx} className="row g-2 mb-2 align-items-end"><div className="col-5"><select className="form-select" value={item.product} onChange={e => updateFrequentlyBought(idx, 'product', e.target.value)}><option value="">Select Product</option>{/* You can fetch product list here if needed */}<option>Sample Product</option></select></div><div className="col-5"><select className="form-select" value={item.category} onChange={e => updateFrequentlyBought(idx, 'category', e.target.value)}><option value="">Select Category</option>{categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}</select></div><div className="col-2">{formData.frequentlyBought.length > 1 && <button type="button" className="btn btn-sm btn-danger" onClick={() => removeFrequentlyBought(idx)}>Remove</button>}</div></div>))}
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addFrequentlyBought}>+ Add More</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}