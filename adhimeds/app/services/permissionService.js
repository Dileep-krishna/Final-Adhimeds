// services/roleService.js
import SERVERURL from './serverURL';

// Minimal JSON parser – throws if invalid
async function handleResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response');
  }
}

// ========== Role CRUD ==========

export const getAllRoles = async () => {
  const res = await fetch(`${SERVERURL}/api/roles`);
  return handleResponse(res);
};

export const getRoleById = async (roleId) => {
  const res = await fetch(`${SERVERURL}/api/roles/${roleId}`);
  return handleResponse(res);
};

export const createRole = async (roleData) => {
  const res = await fetch(`${SERVERURL}/api/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(roleData),
  });
  return handleResponse(res);
};

export const updateRole = async (roleId, roleData) => {
  const res = await fetch(`${SERVERURL}/api/roles/${roleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(roleData),
  });
  return handleResponse(res);
};

export const deleteRole = async (roleId) => {
  const res = await fetch(`${SERVERURL}/api/roles/${roleId}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
};

// ========== Role Permission CRUD ==========

export const getRolePermissions = async (roleName) => {
  const res = await fetch(`${SERVERURL}/api/role-permissions/${encodeURIComponent(roleName)}`);
  return handleResponse(res);
};

export const setRolePermissions = async (roleName, permissions) => {
  const res = await fetch(`${SERVERURL}/api/role-permissions/${encodeURIComponent(roleName)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions }),
  });
  return handleResponse(res);
};

export const deleteRolePermissions = async (roleName) => {
  const res = await fetch(`${SERVERURL}/api/role-permissions/${encodeURIComponent(roleName)}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
};