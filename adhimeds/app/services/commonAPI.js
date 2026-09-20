import axios from "axios";

const commonAPI = async (method, url, body = {}, headers = {}) => {
  try {
    // ✅ Request log
    console.log("📤 API Request:");
    console.log("➡️ Method:", method);
    console.log("➡️ URL:", url);
    console.log("➡️ Body:", body);
    console.log("➡️ Headers:", headers);

    const response = await axios({
      method,
      url,
      ...(method === "GET"
        ? { params: body }   // ✅ for GET
        : { data: body }),   // ✅ for POST/PUT/DELETE
      headers
    });

    // ✅ Success log
    console.log("✅ API Success:");
    console.log("⬅️ Status:", response.status);
    console.log("⬅️ Data:", response.data);

    return response.data;

  } catch (error) {
    console.log("❌ API Failed");

    // ✅ Error logs (clean & useful)
    console.log("⚠️ Message:", error.message);

    if (error.response) {
      console.log("⚠️ Status:", error.response.status);
      console.log("⚠️ Error Data:", error.response.data);
    } else {
      console.log("⚠️ No response from server (Network error)");
    }

    // ✅ Return structured error
    return {
      success: false,
      message: error?.response?.data?.message || error.message
    };
  }
};

export default commonAPI;