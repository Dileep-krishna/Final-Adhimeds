// services/brandService.js
import SERVERURL from './serverURL';

async function handleResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response');
  }
}

// ─── Get all brands (with pagination & search) ───
export const getAllBrands = async (page = 1, limit = 10, search = '', filter = 'all') => {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  if (search) params.append('search', search);
  if (filter !== 'all') params.append('filter', filter);
  const res = await fetch(`${SERVERURL}/api/brands?${params.toString()}`);
  return handleResponse(res);
};

// ─── Get single brand ───
export const getBrandById = async (brandId) => {
  const res = await fetch(`${SERVERURL}/api/brands/${brandId}`);
  return handleResponse(res);
};

// ─── Create brand ───
export const createBrand = async (brandData) => {
  const isFormData = brandData instanceof FormData;
  const options = {
    method: 'POST',
    body: isFormData ? brandData : JSON.stringify(brandData),
  };
  if (!isFormData) {
    options.headers = { 'Content-Type': 'application/json' };
  }
  const res = await fetch(`${SERVERURL}/api/brands`, options);
  return handleResponse(res);
};

// ─── Update brand ───
export const updateBrand = async (brandId, brandData) => {
  const isFormData = brandData instanceof FormData;
  const options = {
    method: 'PUT',
    body: isFormData ? brandData : JSON.stringify(brandData),
  };
  if (!isFormData) {
    options.headers = { 'Content-Type': 'application/json' };
  }
  const res = await fetch(`${SERVERURL}/api/brands/${brandId}`, options);
  return handleResponse(res);
};

// ─── Delete brand ───
export const deleteBrand = async (brandId) => {
  const res = await fetch(`${SERVERURL}/api/brands/${brandId}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
};

// ─── Bulk Import ───
export const bulkImportBrandsAPI = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${SERVERURL}/api/brands/bulk-import`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
};

// ─── Bulk Export ───
export const bulkExportBrandsAPI = async () => {
  const res = await fetch(`${SERVERURL}/api/brands/export`);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Export failed');
  }
  return res.blob();
};