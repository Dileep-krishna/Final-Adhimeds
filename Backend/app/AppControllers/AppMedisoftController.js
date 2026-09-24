import https from "https";

export const getMedisoftShops = async (req, res) => {
  console.log("\n========== MEDISOFT SHOPS ==========");

  try {
    const username = process.env.MEDISOFT_USERNAME;
    const password = process.env.MEDISOFT_PASSWORD;

    console.log("Username exists:", !!username);
    console.log("Password exists:", !!password);
    console.log("Password length:", password?.length);

    if (!username || !password) {
      console.error("Medisoft credentials missing");

      return res.status(500).json({
        error: true,
        message: "Medisoft credentials missing",
      });
    }

    const body = JSON.stringify({
      username,
      password,
    });

    console.log("Request body length:", Buffer.byteLength(body));

    const options = {
      hostname: "api.medisoft.in",
      port: 443,
      path: "/adhapi/shops/getshopslist",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        Accept: "*/*",
        "User-Agent": "PostmanRuntime/7.45.0",
        Connection: "keep-alive",
      },
    };

    console.log("Calling Medisoft...");

    const request = https.request(options, (response) => {
      let data = "";

      console.log("Medisoft status:", response.statusCode);

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        console.log("Medisoft response:", data);

        let result;

        try {
          result = JSON.parse(data);
        } catch (error) {
          console.error("JSON parse error:", error.message);

          return res.status(500).json({
            error: true,
            message: "Invalid response from Medisoft",
            raw: data,
          });
        }

        return res.status(response.statusCode || 500).json(result);
      });
    });

    request.on("error", (error) => {
      console.error("Medisoft request error:", error);

      return res.status(500).json({
        error: true,
        message: "Unable to connect to Medisoft",
        details: error.message,
      });
    });

    // GET request with JSON body
    request.write(body);
    request.end();
  } catch (error) {
    console.error("Medisoft controller error:", error);

    return res.status(500).json({
      error: true,
      message: "Medisoft integration error",
      details: error.message,
    });
  }
};