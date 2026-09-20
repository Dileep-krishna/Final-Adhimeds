// services/shopService.js

const EXTERNAL_API_URL = "https://api.medisoft.in/adhapi/shops/getshopslist";

// Helper – parse JSON or throw clean error
async function handleResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from external API: ${text.substring(0, 200)}`);
  }
}

/**
 * Fetch shops list from external Medisoft API
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>} parsed JSON response
 */
export const getShopsList = async (username, password) => {
  const res = await fetch(EXTERNAL_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  // Check for HTTP errors (optional but recommended)
  if (!res.ok) {
    throw new Error(`External API error: ${res.status} ${res.statusText}`);
  }

  return handleResponse(res);
};