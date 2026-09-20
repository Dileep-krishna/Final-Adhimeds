// warrantyAPI.js
import SERVERURL from "./serverURL";

// Helper – parse JSON or throw clean error
async function handleResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON: ${text.substring(0, 200)}`);
  }
}

// GET ALL WARRANTIES (with optional query params)
export const getWarrantiesAPI = async (queryParams = "") => {
  const url = queryParams
    ? `${SERVERURL}/api/warranties?${queryParams}`
    : `${SERVERURL}/api/warranties`;
  const res = await fetch(url);
  return handleResponse(res);
};

// GET SINGLE WARRANTY BY ID
export const getWarrantyByIdAPI = async (id) => {
  const url = `${SERVERURL}/api/warranties/${id}`;
  const res = await fetch(url);
  return handleResponse(res);
};

// CREATE WARRANTY – accepts FormData (with logo) or plain object
export const createWarrantyAPI = async (warrantyData) => {
  const url = `${SERVERURL}/api/warranties`;
  const isFormData = warrantyData instanceof FormData;
  const options = {
    method: "POST",
    body: warrantyData,
  };
  if (!isFormData) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(warrantyData);
  }
  const res = await fetch(url, options);
  return handleResponse(res);
};

// UPDATE WARRANTY – accepts FormData or plain object
export const updateWarrantyAPI = async (id, warrantyData) => {
  const url = `${SERVERURL}/api/warranties/${id}`;
  const isFormData = warrantyData instanceof FormData;
  const options = {
    method: "PUT",
    body: warrantyData,
  };
  if (!isFormData) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(warrantyData);
  }
  const res = await fetch(url, options);
  return handleResponse(res);
};

// DELETE WARRANTY
export const deleteWarrantyAPI = async (id) => {
  const url = `${SERVERURL}/api/warranties/${id}`;
  const res = await fetch(url, { method: "DELETE" });
  return handleResponse(res);
};