// storeManagementAPI.js
import SERVERURL from "./serverURL";

// Helper to parse JSON response; throws raw text if not JSON
async function handleResponse(res) {
  const text = await res.text();
  console.log('📡 Raw response text:', text);
  try {
    const json = JSON.parse(text);
    console.log('✅ Parsed JSON response:', json);
    return json;
  } catch (e) {
    console.error('❌ Failed to parse JSON:', e);
    throw new Error(`Server returned non‑JSON: ${text.substring(0, 200)}`);
  }
}

// CREATE STORE – accepts FormData (for file uploads) or plain object
export const createStoreAPI = async (storeData) => {
  const url = `${SERVERURL}/api/store`;
  const isFormData = storeData instanceof FormData;
  
  console.log('📤 createStoreAPI called with data type:', isFormData ? 'FormData' : 'JSON');
  
  if (isFormData) {
    console.log('📦 FormData entries:');
    for (let [key, value] of storeData.entries()) {
      console.log(`   ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
    }
  } else {
    console.log('📦 JSON payload:', storeData);
  }

  const options = {
    method: "POST",
    body: storeData,
  };
  if (!isFormData) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(storeData);
    console.log('📨 Sending JSON to backend:', options.body);
  } else {
    console.log('📨 Sending FormData to backend');
  }

  try {
    const res = await fetch(url, options);
    console.log('📥 Response status:', res.status, res.statusText);
    return handleResponse(res);
  } catch (error) {
    console.error('🔥 Fetch error:', error);
    throw error;
  }
};

// GET ALL STORES – optional query parameters (unchanged)
export const getStoresAPI = async (queryParams = "") => {
  const url = queryParams
    ? `${SERVERURL}/api/store?${queryParams}`
    : `${SERVERURL}/api/store`;
  console.log('🔍 GET stores URL:', url);
  const res = await fetch(url);
  return handleResponse(res);
};

// GET SINGLE STORE BY ID (unchanged)
export const getStoreByIdAPI = async (id) => {
  const url = `${SERVERURL}/api/store/${id}`;
  console.log('🔍 GET store by ID URL:', url);
  const res = await fetch(url);
  return handleResponse(res);
};

// UPDATE STORE – accepts FormData or plain object (unchanged)
export const updateStoreAPI = async (id, storeData) => {
  const url = `${SERVERURL}/api/store/${id}`;
  const isFormData = storeData instanceof FormData;
  
  console.log('📤 updateStoreAPI called for ID:', id, 'data type:', isFormData ? 'FormData' : 'JSON');
  
  if (isFormData) {
    console.log('📦 FormData entries:');
    for (let [key, value] of storeData.entries()) {
      console.log(`   ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
    }
  } else {
    console.log('📦 JSON payload:', storeData);
  }

  const options = {
    method: "PUT",
    body: storeData,
  };
  if (!isFormData) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(storeData);
    console.log('📨 Sending JSON to backend:', options.body);
  } else {
    console.log('📨 Sending FormData to backend');
  }

  try {
    const res = await fetch(url, options);
    console.log('📥 Response status:', res.status, res.statusText);
    return handleResponse(res);
  } catch (error) {
    console.error('🔥 Fetch error:', error);
    throw error;
  }
};

// DELETE STORE (unchanged)
export const deleteStoreAPI = async (id) => {
  const url = `${SERVERURL}/api/store/${id}`;
  console.log('🗑️ DELETE store URL:', url);
  const res = await fetch(url, { method: "DELETE" });
  return handleResponse(res);
};

// ---------------------------
// ✅ NEW: GET shops for order routing (includes district & status)
// ---------------------------
export const getShopsForOrderAPI = async () => {
  const url = `${SERVERURL}/api/medisoft/shops`;
  console.log('🔍 GET shops for order URL:', url);
  const res = await fetch(url);
  return handleResponse(res);
};

// storeManagementAPI.js (add these after existing functions)

// ─── UPDATE product access for a store ───
export const updateStoreProductAccess = async (productId, storeId, enabled) => {
  const url = `${SERVERURL}/api/store/product-access/${productId}/${storeId}`;
  console.log('🔄 updateStoreProductAccess URL:', url);
  console.log('📦 Payload:', { enabled });

  const options = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  };

  try {
    const res = await fetch(url, options);
    console.log('📥 Response status:', res.status, res.statusText);
    return handleResponse(res);
  } catch (error) {
    console.error('🔥 Fetch error:', error);
    throw error;
  }
};

// ─── GET all products for a store (with access status) ───
// In storeManagementAPI.js

// GET all products for a store (with pagination, search, filter, sort)
export const getStoreProductsAccess = async (storeId, options = {}) => {
  if (!storeId) throw new Error('Store ID is required');

  const { page = 1, limit = 10, search = '', filter = '', sort = '' } = options;

  // Build query string
  const params = new URLSearchParams({
    page,
    limit,
    search,
    filter,
    sort,
  });

  const res = await fetch(`${SERVERURL}/api/store/products/${storeId}?${params.toString()}`);
  return handleResponse(res);
};

// ─── DELETE product access (optional) ───
export const deleteStoreProductAccess = async (productId, storeId) => {
  const url = `${SERVERURL}/api/store/product-access/${productId}/${storeId}`;
  console.log('🗑️ deleteStoreProductAccess URL:', url);
  try {
    const res = await fetch(url, { method: "DELETE" });
    return handleResponse(res);
  } catch (error) {
    console.error('🔥 Fetch error:', error);
    throw error;
  }
};

// storeManagementAPI.js – add this function

// ─── Update store product price & stock ───
export const updateStoreProductPriceStock = async (productId, storeId, data) => {
  const url = `${SERVERURL}/api/store/product/${productId}/${storeId}`;
  console.log('🔄 updateStoreProductPriceStock URL:', url);
  console.log('📦 Payload:', data);

  const options = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };

  try {
    const res = await fetch(url, options);
    console.log('📥 Response status:', res.status, res.statusText);
    return handleResponse(res);
  } catch (error) {
    console.error('🔥 Fetch error:', error);
    throw error;
  }
};
// ─── GET store product details (with custom price/stock) ───
export const getStoreProductDetails = async (productId, storeId) => {
  const url = `${SERVERURL}/api/store/product-details/${productId}/${storeId}`;
  console.log('🔍 getStoreProductDetails URL:', url);
  try {
    const res = await fetch(url);
    return handleResponse(res);
  } catch (error) {
    console.error('🔥 Fetch error:', error);
    throw error;
  }
};