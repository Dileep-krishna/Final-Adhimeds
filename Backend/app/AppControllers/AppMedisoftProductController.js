import https from "https";

export const getMedisoftProducts = async (req, res) => {
  try {
    const username = process.env.MEDISOFT_USERNAME;
    const password = process.env.MEDISOFT_PASSWORD;
    const shopId = req.params.shopId;

    console.log("========== MEDISOFT PRODUCTS ==========");
    console.log("Username exists:", !!username);
    console.log("Password exists:", !!password);
    console.log("Shop ID:", shopId);

    if (!username || !password) {
      return res.status(500).json({
        success: false,
        message: "Medisoft credentials missing",
      });
    }

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop ID is required",
      });
    }

    // Medisoft API expects these exact parameter names
    const requestBody = JSON.stringify({
      password,
      username,
      id: shopId,
    });

    const options = {
      hostname: "api.medisoft.in",
      port: 443,
      path: "/adhapi/stock/getstockdetails",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
        Accept: "*/*",
        "User-Agent": "PostmanRuntime/7.45.0",
        Connection: "keep-alive",
      },
    };

    const request = https.request(options, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        console.log(
          "Medisoft Products Status:",
          response.statusCode
        );

        try {
          const parsedData = JSON.parse(data);

          return res
            .status(response.statusCode || 200)
            .json(parsedData);
        } catch (error) {
          console.error(
            "Medisoft Products JSON parse error:",
            error
          );

          return res.status(502).json({
            success: false,
            message: "Invalid response from Medisoft",
            rawResponse: data,
          });
        }
      });
    });

    request.on("error", (error) => {
      console.error(
        "Medisoft Products request error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to connect to Medisoft",
        error: error.message,
      });
    });

    request.write(requestBody);
    request.end();
  } catch (error) {
    console.error(
      "Medisoft Products Controller Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};