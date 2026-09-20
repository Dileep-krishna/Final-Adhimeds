// services/categoryService.js
import SERVERURL from './serverURL';

async function handleResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response');
  }
}

// ─── CRUD ──────────────────────────────────────────────

export const createCategoryAPI = async (formData) => {
  const res = await fetch(`${SERVERURL}/api/category`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
};

export const getCategoriesAPI = async (page = 1, limit = 10, search = "") => {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  if (search) params.append('search', search);
  const res = await fetch(`${SERVERURL}/api/category?${params.toString()}`);
  return handleResponse(res);
};

export const getCategoryByIdAPI = async (id) => {
  const res = await fetch(`${SERVERURL}/api/category/${id}`);
  return handleResponse(res);
};

export const updateCategoryAPI = async (id, formData) => {
  const res = await fetch(`${SERVERURL}/api/category/${id}`, {
    method: "PUT",
    body: formData,
  });
  return handleResponse(res);
};

export const deleteCategoryAPI = async (id) => {
  const res = await fetch(`${SERVERURL}/api/category/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
};

// ─── Bulk Operations ──────────────────────────────────

/**
 * Upload a CSV/Excel file for bulk category import.
 * @param {File} file - The file to upload.
 * @returns {Promise} - Resolves with the import result.
 */
export const bulkImportCategoriesAPI = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${SERVERURL}/api/category/bulk-import`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
};

/**
 * Download all categories as an Excel file.
 * @returns {Promise<Blob>} - The file blob.
 */
export const bulkExportCategoriesAPI = async () => {
  const res = await fetch(`${SERVERURL}/api/category/export`);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Export failed');
  }
  return res.blob(); // returns a Blob (file content)
};

/**
 * Download the reference template Excel file.
 * @returns {Promise<Blob>} - The file blob.
 */
export const downloadTemplateAPI = async () => {
  const res = await fetch(`${SERVERURL}/api/category/template`);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to download template');
  }
  return res.blob(); // returns a Blob
};