// services/staffService.js
import SERVERURL from "./serverURL";

// Single, fast JSON parser – throws on invalid JSON
async function handleResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON: ${text.substring(0, 200)}`);
  }
}

// CREATE STAFF
export const createStaffAPI = async (staffData) => {
  const url = `${SERVERURL}/api/staff`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(staffData),
  });
  return handleResponse(res);
};

// GET ALL STAFF (with optional query params)
export const getStaffAPI = async (queryParams = "") => {
  const url = queryParams
    ? `${SERVERURL}/api/staff?${queryParams}`
    : `${SERVERURL}/api/staff`;
  const res = await fetch(url);
  return handleResponse(res);
};

// GET STAFF BY ID
export const getStaffByIdAPI = async (id) => {
  const url = `${SERVERURL}/api/staff/${id}`;
  const res = await fetch(url);
  return handleResponse(res);
};

// UPDATE STAFF
export const updateStaffAPI = async (id, staffData) => {
  const url = `${SERVERURL}/api/staff/${id}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(staffData),
  });
  return handleResponse(res);
};

// DELETE STAFF
export const deleteStaffAPI = async (id) => {
  const url = `${SERVERURL}/api/staff/${id}`;
  const res = await fetch(url, { method: "DELETE" });
  return handleResponse(res);
};

// GET ALL DISTRICTS (with optional query params)
export const getAllDistricts = async (queryParams = "") => {
  const url = queryParams
    ? `${SERVERURL}/api/districts?${queryParams}`
    : `${SERVERURL}/api/districts`;
  const res = await fetch(url);
  return handleResponse(res);
};