// services/deliveryService.js
import SERVERURL from "./serverURL";

// ─── Robust response handler ──────────────────────────────
async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ API Error (${res.status}):`, text.slice(0, 200));
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error("❌ Invalid JSON response:", text.slice(0, 200));
    throw new Error("Invalid JSON response from server");
  }
}

// ─── DELIVERY BOY CRUD (matching your backend routes) ────

/**
 * Get all delivery boys with pagination, search, and status.
 * Backend: GET /all?page=1&limit=10&search=...&status=...
 */
export const getDeliveryBoysAPI = async (page = 1, limit = 10, search = '', status = 'all') => {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  if (search) params.append('search', search);
  if (status && status !== 'all') params.append('status', status);
  const res = await fetch(`${SERVERURL}/api/all?${params.toString()}`);
  return handleResponse(res);
};

/**
 * Get a single delivery boy by ID.
 * Backend: GET /:id (add this route if missing)
 */
export const getDeliveryBoyByIdAPI = async (id) => {
  const res = await fetch(`${SERVERURL}/api/${id}`);
  return handleResponse(res);
};

/**
 * Add a new delivery boy (FormData with files).
 * Backend: POST /add
 */
export const addDeliveryBoyAPI = async (formData) => {
  const res = await fetch(`${SERVERURL}/api/add`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
};

// Alias for consistency (optional)
export const createDeliveryBoyAPI = addDeliveryBoyAPI;

/**
 * Update a delivery boy (FormData or JSON).
 * Backend: PUT /:id
 */
export const updateDeliveryBoyAPI = async (id, data) => {
  const isFormData = data instanceof FormData;
  const options = {
    method: 'PUT',
    body: isFormData ? data : JSON.stringify(data),
  };
  if (!isFormData) {
    options.headers = { 'Content-Type': 'application/json' };
  }
  const res = await fetch(`${SERVERURL}/api/${id}`, options);
  return handleResponse(res);
};

/**
 * Delete a delivery boy.
 * Backend: DELETE /:id
 */
export const deleteDeliveryBoyAPI = async (id) => {
  const res = await fetch(`${SERVERURL}/api/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
};

/**
 * Assign orders to a delivery boy.
 * Backend: POST /assign (if implemented)
 */
export const assignOrdersToBoyAPI = async (boyId, orderIds) => {
  const res = await fetch(`${SERVERURL}/api/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boyId, orderIds }),
  });
  return handleResponse(res);
};