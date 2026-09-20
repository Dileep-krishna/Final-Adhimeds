"use client";
import { useState, useEffect } from "react";

export default function TestProductsPage() {
  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState(null);

  // Fetch shops on mount
  useEffect(() => {
    async function fetchShops() {
      try {
        const res = await fetch("/api/medisoft/shops");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setShops(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load shops:", err);
        setError("Could not load shops. Check API.");
      } finally {
        setLoadingShops(false);
      }
    }
    fetchShops();
  }, []);

  // Fetch products when a shop is selected
  const fetchProducts = async (shopId) => {
    setLoadingProducts(true);
    setProducts([]);
    setError(null);
    try {
      const res = await fetch("/api/medisoft/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const data = await res.json();
      // Normalize product array
      let productList = [];
      if (Array.isArray(data)) productList = data;
      else if (data?.products && Array.isArray(data.products)) productList = data.products;
      else if (data?.body && Array.isArray(data.body)) productList = data.body;
      else productList = [];
      setProducts(productList);
      if (productList.length === 0) setError("No products found for this shop.");
    } catch (err) {
      console.error("Products fetch error:", err);
      setError(err.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleShopChange = (e) => {
    const shopId = e.target.value;
    const shop = shops.find(s => s.shopid === shopId);
    setSelectedShop(shop);
    if (shopId) fetchProducts(shopId);
    else setProducts([]);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Product Checking Page</h1>
      <p>Select a shop to view its products (stock details).</p>

      {loadingShops ? (
        <p>Loading shops...</p>
      ) : shops.length === 0 ? (
        <p style={{ color: "red" }}>No shops found. Check API.</p>
      ) : (
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="shopSelect" style={{ marginRight: "10px", fontWeight: "bold" }}>Choose a shop:</label>
          <select id="shopSelect" onChange={handleShopChange} style={{ padding: "8px 12px", width: "300px" }}>
            <option value="">-- Select a shop --</option>
            {shops.map(shop => (
              <option key={shop.shopid} value={shop.shopid}>
                {shop.name} (ID: {shop.shopid})
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedShop && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Products for: {selectedShop.name}</h3>
          {loadingProducts && <p>⏳ Loading products...</p>}
          {error && !loadingProducts && <p style={{ color: "red" }}>Error: {error}</p>}
          {!loadingProducts && products.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <thead>
                  <tr style={{ background: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                    <th style={{ padding: "12px", textAlign: "left" }}>Product Name</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Quantity</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Pack</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>MRP (₹)</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Total Value (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod, idx) => {
                    const qty = parseFloat(prod.quantity) || 0;
                    const mrp = parseFloat(prod.mrp) || 0;
                    const total = (qty * mrp).toFixed(2);
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px" }}>{prod.productname || prod.itemname || "—"}</td>
                        <td style={{ padding: "10px" }}>{qty}</td>
                        <td style={{ padding: "10px" }}>{prod.pack || "N/A"}</td>
                        <td style={{ padding: "10px" }}>{mrp.toFixed(2)}</td>
                        <td style={{ padding: "10px" }}>₹{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loadingProducts && products.length === 0 && !error && selectedShop && (
            <p>No products returned for this shop.</p>
          )}
        </div>
      )}
    </div>
  );
}