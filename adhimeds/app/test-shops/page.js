"use client";
import { useState } from "react";

export default function TestShopsPage() {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchShops = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      console.log("Fetching /api/medisoft/shops with GET...");
      const res = await fetch("/api/medisoft/shops"); // GET request (default)
      console.log("Status:", res.status);
      const text = await res.text();
      console.log("Raw response:", text);
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        json = { rawText: text };
      }
      setResponse({ status: res.status, data: json, raw: text });
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Test Medisoft Shops API</h1>
      <button onClick={fetchShops} disabled={loading}>
        {loading ? "Loading..." : "Fetch Shops"}
      </button>

      {error && (
        <div style={{ color: "red", marginTop: "20px" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div style={{ marginTop: "20px" }}>
          <h3>Response Status: {response.status}</h3>
          <pre style={{ background: "#f4f4f4", padding: "10px", overflowX: "auto" }}>
            {JSON.stringify(response.data, null, 2)}
          </pre>
          <details>
            <summary>Raw text</summary>
            <pre style={{ background: "#eee", padding: "10px", whiteSpace: "pre-wrap" }}>
              {response.raw}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}