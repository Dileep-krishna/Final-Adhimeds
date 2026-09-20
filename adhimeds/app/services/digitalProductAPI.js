// services/medicalProductService.js
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

// CREATE MEDICAL PRODUCT (FormData)
export const createMedicalProductAPI = async (formData) => {
  const res = await fetch(`${SERVERURL}/api/medical-products`, {
    method: "POST",
    body: formData, // multipart/form-data
  });
  return handleResponse(res);
};

// GET ALL (with optional query params)
export const getMedicalProductsAPI = async (query = "") => {
  const url = query
    ? `${SERVERURL}/api/medical-products?${query}`
    : `${SERVERURL}/api/medical-products`;
  const res = await fetch(url);
  return handleResponse(res);
};

// GET BY ID
export const getMedicalProductByIdAPI = async (id) => {
  if (!id) throw new Error("ID is required");
  const res = await fetch(`${SERVERURL}/api/medical-products/${id}`);
  return handleResponse(res);
};

// UPDATE (FormData)
export const updateMedicalProductAPI = async (id, formData) => {
  const res = await fetch(`${SERVERURL}/api/medical-products/${id}`, {
    method: "PUT",
    body: formData, // multipart/form-data
  });
  return handleResponse(res);
};

// DELETE
export const deleteMedicalProductAPI = async (id) => {
  if (!id) throw new Error("ID is required");
  const res = await fetch(`${SERVERURL}/api/medical-products/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
};

// TOGGLE (published / featured / todayDeal)
export const toggleMedicalProductAPI = async (id, field) => {
  const res = await fetch(`${SERVERURL}/api/medical-products/${id}/toggle`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ field }),
  });
  return handleResponse(res);
};