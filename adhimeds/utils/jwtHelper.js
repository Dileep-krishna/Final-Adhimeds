// utils/jwtHelper.js

/**
 * Extract storeId (ObjectId) from the JWT token stored in localStorage/sessionStorage
 * @returns {string|null} The store's ObjectId or null if not found
 */
export const getStoreIdFromToken = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // The token contains 'id' (ObjectId) from your backend
    return payload.id || payload.storeId || null;
  } catch (e) {
    console.error('Failed to parse token:', e);
    return null;
  }
};

/**
 * Get shopid from storage
 * @returns {string|null}
 */
export const getShopIdFromStorage = () => {
  return localStorage.getItem('shopid') || sessionStorage.getItem('shopid') || null;
};

/**
 * Get storeName from storage
 * @returns {string|null}
 */
export const getStoreNameFromStorage = () => {
  return localStorage.getItem('storeName') || sessionStorage.getItem('storeName') || null;
};

/**
 * Get district from storage
 * @returns {string|null}
 */
export const getDistrictFromStorage = () => {
  return localStorage.getItem('district') || sessionStorage.getItem('district') || null;
};

/**
 * Get the correct storeId – from token first, then fallback to localStorage
 * @returns {string|null}
 */
export const getStoreId = () => {
  const fromToken = getStoreIdFromToken();
  if (fromToken) return fromToken;
  return localStorage.getItem('storeId') || sessionStorage.getItem('storeId') || null;
};