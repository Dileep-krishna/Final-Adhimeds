// services/orderAPI.js
// ✅ FRONTEND ONLY – fetch calls, no backend imports

const SERVERURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

async function handleResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response');
  }
}

// ---------- ORDER CRUD ----------
export const placeOrder = async (items) => {
  const res = await fetch(`${SERVERURL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return handleResponse(res);
};

export const getAllOrders = async () => {
  const res = await fetch(`${SERVERURL}/api/orders`);
  return handleResponse(res);
};

export const getOrdersByStore = async (storeId) => {
  const res = await fetch(`${SERVERURL}/api/orders?storeId=${storeId}`);
  return handleResponse(res);
};

export const getOrderById = async (orderId) => {
  const res = await fetch(`${SERVERURL}/api/orders/${orderId}`);
  return handleResponse(res);
};

// ---------- UPDATE ITEM STATUS (with optional billUrl) ----------
export const updateItemStatus = async (orderId, itemId, status, assignedTo, billUrl) => {
  const body = { status };
  if (assignedTo !== undefined) body.assignedTo = assignedTo;
  if (billUrl !== undefined) body.billUrl = billUrl;
  const res = await fetch(`${SERVERURL}/api/orders/${orderId}/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
};

// ---------- DELETE ITEM ----------
export const deleteItem = async (orderId, itemId) => {
  const res = await fetch(`${SERVERURL}/api/orders/${orderId}/items/${itemId}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
};

// ---------- BILL UPLOAD ----------
export const uploadBill = async (orderId, itemId, file) => {
  const formData = new FormData();
  formData.append('bill', file);
  const res = await fetch(`${SERVERURL}/api/orders/${orderId}/items/${itemId}/upload-bill`, {
    method: 'POST',
    body: formData,
    // No Content-Type – FormData sets it automatically
  });
  return handleResponse(res);
};

// ---------- NOTIFICATIONS ----------
export const getNotifications = async () => {
  const res = await fetch(`${SERVERURL}/api/notifications`);
  return handleResponse(res);
};

export const createNotification = async (orderId, message) => {
  const res = await fetch(`${SERVERURL}/api/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, message }),
  });
  return handleResponse(res);
};

export const markNotificationRead = async (notificationId) => {
  const res = await fetch(`${SERVERURL}/api/notifications/${notificationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ read: true }),
  });
  return handleResponse(res);
};

export const clearAllNotifications = async () => {
  const res = await fetch(`${SERVERURL}/api/notifications`, {
    method: 'DELETE',
  });
  return handleResponse(res);
};

export const updateOrderStatus = async (orderId, status) => {
  const res = await fetch(`${SERVERURL}/api/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
};