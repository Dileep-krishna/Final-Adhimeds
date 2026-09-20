// services/customReviewService.js
import SERVERURL from "./serverURL";

// Minimal JSON parser – throws if invalid
async function handleResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response');
  }
}

// CREATE – supports FormData (with file uploads)
export const createCustomReviewAPI = async (formData) => {
  const res = await fetch(`${SERVERURL}/api/custom-reviews`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
};

// GET ALL – with optional filters (e.g., ?productId=...)
export const getAllCustomReviewsAPI = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const url = queryParams
    ? `${SERVERURL}/api/custom-reviews?${queryParams}`
    : `${SERVERURL}/api/custom-reviews`;
  const res = await fetch(url);
  return handleResponse(res);
};

// GET SINGLE BY ID
export const getCustomReviewById = async (id) => {
  const res = await fetch(`${SERVERURL}/api/custom-reviews/${id}`);
  return handleResponse(res);
};

// UPDATE – supports FormData (with optional file)
export const updateCustomReviewAPI = async (id, formData) => {
  const res = await fetch(`${SERVERURL}/api/custom-reviews/${id}`, {
    method: 'PUT',
    body: formData,
  });
  return handleResponse(res);
};

// DELETE
export const deleteCustomReviewAPI = async (id) => {
  const res = await fetch(`${SERVERURL}/api/custom-reviews/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
};