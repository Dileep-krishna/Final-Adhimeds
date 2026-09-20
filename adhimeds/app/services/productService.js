// services/productService.js
import SERVERURL from "./serverURL";

async function handleResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response');
  }
}

// CREATE PRODUCT (supports JSON or FormData)
export const createProductAPI = async (productData) => {
  const isFormData = productData instanceof FormData;
  const options = {
    method: "POST",
    body: isFormData ? productData : JSON.stringify(productData),
  };
  if (!isFormData) {
    options.headers = { "Content-Type": "application/json" };
  }
  const res = await fetch(`${SERVERURL}/api/products`, options);
  return handleResponse(res);
};

// GET ALL PRODUCTS (with optional query params)
export const getProductsAPI = async (queryParams = "") => {
  const url = queryParams
    ? `${SERVERURL}/api/products?${queryParams}`
    : `${SERVERURL}/api/products`;
  const res = await fetch(url);
  return handleResponse(res);
};

// GET SINGLE PRODUCT BY ID
export const getProductByIdAPI = async (id) => {
  if (!id) throw new Error('Product ID is required');
  const res = await fetch(`${SERVERURL}/api/products/${id}`);
  return handleResponse(res);
};

// UPDATE PRODUCT (supports JSON or FormData)
export const updateProductAPI = async (id, productData) => {
  if (!id) throw new Error('Product ID is required');
  const isFormData = productData instanceof FormData;
  const options = {
    method: "PUT",
    body: isFormData ? productData : JSON.stringify(productData),
  };
  if (!isFormData) {
    options.headers = { "Content-Type": "application/json" };
  }
  const res = await fetch(`${SERVERURL}/api/products/${id}`, options);
  return handleResponse(res);
};

// DELETE PRODUCT
export const deleteProductAPI = async (id) => {
  if (!id) throw new Error('Product ID is required');
  const res = await fetch(`${SERVERURL}/api/products/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
};

// ================= BULK IMPORT / EXPORT =================

/**
 * Upload a CSV/Excel file for bulk product import.
 * @param {File} file - The file to upload.
 * @returns {Promise} - Resolves with the import result.
 */
export const bulkImportProductsAPI = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${SERVERURL}/api/products/bulk-import`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
};

/**
 * Download all products as an Excel file.
 * @returns {Promise<Blob>} - The file blob.
 */
export const bulkExportProductsAPI = async () => {
  const res = await fetch(`${SERVERURL}/api/products/export`);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Export failed');
  }
  return res.blob();
};

// ================= STORE PRODUCT OVERRIDE APIS =================
// GET product with store overrides merged
export const getStoreProductAPI = async (productId, storeId) => {
  if (!productId) throw new Error('Product ID is required');
  if (!storeId) throw new Error('Store ID is required');
  const res = await fetch(`${SERVERURL}/api/store/products/${productId}?storeId=${storeId}`);
  return handleResponse(res);
};

// UPDATE store‑specific fields (store user)
export const updateStoreProductAPI = async (productId, storeId, data) => {
  if (!productId) throw new Error('Product ID is required');
  if (!storeId) throw new Error('Store ID is required');
  const isFormData = data instanceof FormData;
  const options = {
    method: "PUT",
    body: isFormData ? data : JSON.stringify(data),
  };
  if (!isFormData) {
    options.headers = { "Content-Type": "application/json" };
  }
  const res = await fetch(`${SERVERURL}/api/store/products/${productId}?storeId=${storeId}`, options);
  return handleResponse(res);
};

// DELETE store overrides – revert to master product
export const deleteStoreOverrideAPI = async (productId, storeId) => {
  if (!productId) throw new Error('Product ID is required');
  if (!storeId) throw new Error('Store ID is required');
  const res = await fetch(`${SERVERURL}/api/store/products/${productId}/override?storeId=${storeId}`, {
    method: "DELETE",
  });
  return handleResponse(res);
};

// GET all products for a store (merged with overrides)
export const getAllStoreProductsAPI = async (storeId) => {
  if (!storeId) throw new Error('Store ID is required');
  const res = await fetch(`${SERVERURL}/api/store/products?storeId=${storeId}`);
  return handleResponse(res);
};