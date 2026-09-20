// services/authService.js
import SERVERURL from './serverURL';

async function handleResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response');
  }
}

// ─── Get token from storage ──────────────────────────────
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
  }
  return null;
};

// ─── Helper: add authorization header (if token exists) ──
const authHeaders = () => {
  const token = getToken();
  console.log('🔑 Token being sent:', token ? `${token.substring(0, 20)}...` : 'No token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// ─── Clear token on 401 ──────────────────────────────────
const clearToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminData');
  }
};

// ============================================================
//  ADMIN LOGIN (public)
// ============================================================
export const adminLoginAPI = async (email, password) => {
  const res = await fetch(`${SERVERURL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
};

// ============================================================
//  GET CURRENT ADMIN PROFILE (protected)
// ============================================================
export const getCurrentAdminAPI = async () => {
  const res = await fetch(`${SERVERURL}/api/me`, {
    headers: authHeaders(),
  });
  // If 401, clear token and throw a specific error
  if (res.status === 401) {
    clearToken();
    throw new Error('Session expired. Please login again.');
  }
  return handleResponse(res);
};

// ============================================================
//  UPDATE ADMIN PROFILE (protected) – FormData
// ============================================================
export const updateAdminProfileAPI = async (formData) => {
  const res = await fetch(`${SERVERURL}/api/update-profile`, {
    method: 'PUT',
    headers: authHeaders(), // Do NOT set Content-Type; browser handles FormData
    body: formData,
  });
  if (res.status === 401) {
    clearToken();
    throw new Error('Session expired. Please login again.');
  }
  return handleResponse(res);
};

// ============================================================
//  DELETE AVATAR (protected)
// ============================================================
export const deleteAvatarAPI = async () => {
  const res = await fetch(`${SERVERURL}/api/avatar`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (res.status === 401) {
    clearToken();
    throw new Error('Session expired. Please login again.');
  }
  return handleResponse(res);
};