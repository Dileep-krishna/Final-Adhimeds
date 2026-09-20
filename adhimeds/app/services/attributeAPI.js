// services/attributeService.js
import SERVERURL from "./serverURL";

async function handleResponse(res) {
  console.log(`🔁 handleResponse: status = ${res.status}`);
  const text = await res.text();
  console.log(`📄 Raw response text:`, text);
  try {
    const data = JSON.parse(text);
    console.log(`✅ Parsed JSON:`, data);
    return data;
  } catch (error) {
    console.error(`❌ JSON parse error:`, error);
    throw new Error('Invalid JSON response');
  }
}

// GET ALL ATTRIBUTES (with optional query params)
export const getAttributesAPI = async (queryParams = "") => {
  const url = queryParams
    ? `${SERVERURL}/api/attributes?${queryParams}`
    : `${SERVERURL}/api/attributes`;
  console.log(`🌐 [GET] ${url}`);
  try {
    const res = await fetch(url);
    console.log(`📡 Response status: ${res.status}`);
    return handleResponse(res);
  } catch (error) {
    console.error(`💥 [getAttributesAPI] Fetch error:`, error);
    throw error;
  }
};

// GET SINGLE ATTRIBUTE BY ID
export const getAttributeByIdAPI = async (id) => {
  const url = `${SERVERURL}/api/attributes/${id}`;
  console.log(`🌐 [GET] ${url}`);
  try {
    const res = await fetch(url);
    console.log(`📡 Response status: ${res.status}`);
    return handleResponse(res);
  } catch (error) {
    console.error(`💥 [getAttributeByIdAPI] Fetch error:`, error);
    throw error;
  }
};

// CREATE ATTRIBUTE (JSON)
export const createAttributeAPI = async (attributeData) => {
  const url = `${SERVERURL}/api/attributes`;
  console.log(`🌐 [POST] ${url}`);
  console.log(`📦 Payload:`, attributeData);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attributeData),
    });
    console.log(`📡 Response status: ${res.status}`);
    return handleResponse(res);
  } catch (error) {
    console.error(`💥 [createAttributeAPI] Fetch error:`, error);
    throw error;
  }
};

// UPDATE ATTRIBUTE (JSON)
export const updateAttributeAPI = async (id, attributeData) => {
  const url = `${SERVERURL}/api/attributes/${id}`;
  console.log(`🌐 [PUT] ${url}`);
  console.log(`📦 Payload:`, attributeData);
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attributeData),
    });
    console.log(`📡 Response status: ${res.status}`);
    return handleResponse(res);
  } catch (error) {
    console.error(`💥 [updateAttributeAPI] Fetch error:`, error);
    throw error;
  }
};

// DELETE ATTRIBUTE
export const deleteAttributeAPI = async (id) => {
  const url = `${SERVERURL}/api/attributes/${id}`;
  console.log(`🌐 [DELETE] ${url}`);
  try {
    const res = await fetch(url, {
      method: "DELETE",
    });
    console.log(`📡 Response status: ${res.status}`);
    return handleResponse(res);
  } catch (error) {
    console.error(`💥 [deleteAttributeAPI] Fetch error:`, error);
    throw error;
  }
};