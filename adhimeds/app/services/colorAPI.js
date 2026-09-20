// services/colorService.js
import SERVERURL from './serverURL';

async function handleResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response');
  }
}

export const getColorsAPI = async () => {
  const res = await fetch(`${SERVERURL}/api/colors`);
  return handleResponse(res);
};

export const createColorAPI = async (colorData) => {
  const res = await fetch(`${SERVERURL}/api/colors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(colorData),
  });
  return handleResponse(res);
};

export const updateColorAPI = async (id, colorData) => {
  const res = await fetch(`${SERVERURL}/api/colors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(colorData),
  });
  return handleResponse(res);
};

export const deleteColorAPI = async (id) => {
  const res = await fetch(`${SERVERURL}/api/colors/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
};