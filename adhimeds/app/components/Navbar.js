"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import "./navbar.css";
import CartSidebar from "../pharma-dashboard/components/CartSidebar";

export default function Navbar() {
  const router = useRouter();
  const dropdownRef = useRef();
  const searchRef = useRef();

  // Dropdown state
  const [open, setOpen] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Store selection for search
  const [selectedStore, setSelectedStore] = useState(null);
  const [allStores, setAllStores] = useState([]);

  // Sidebar state
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [storeList, setStoreList] = useState([]);

  const [loaded, setLoaded] = useState(false);

  // Get logged-in store's ID and name
  const [loggedInStoreId, setLoggedInStoreId] = useState(null);
  const [loggedInStoreName, setLoggedInStoreName] = useState("");

  // Get store info from localStorage on mount
  useEffect(() => {
    const storeId = localStorage.getItem('storeId') || sessionStorage.getItem('storeId');
    const storeName = localStorage.getItem('storeName') || sessionStorage.getItem('storeName');
    const storeEmail = localStorage.getItem('storeEmail') || sessionStorage.getItem('storeEmail');
    
    if (storeId) {
      setLoggedInStoreId(storeId);
    }
    if (storeName) {
      setLoggedInStoreName(storeName);
    }
    
    // If we have email but not name, fetch it
    if (storeEmail && !storeName) {
      fetchStoreDetails(storeEmail);
    }
  }, []);

  // Fetch store details if needed
  const fetchStoreDetails = async (email) => {
    try {
      const response = await fetch(`/api/store/by-email?email=${email}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const storeName = data.store.name || data.store.storeName;
          localStorage.setItem('storeName', storeName);
          setLoggedInStoreName(storeName);
        }
      }
    } catch (error) {
      console.error("Failed to fetch store details:", error);
    }
  };

  // Helper: get stock from product
  const getStock = (product) => {
    return parseInt(product.stock ?? product.availableQty ?? product.quantity ?? 0);
  };

  // Fetch all shops and products
  useEffect(() => {
    if (loaded) return;
    
    const abortController = new AbortController();

    async function fetchAllProducts() {
      setLoading(true);
      try {
        // Get store name from state or localStorage
        const storeName = loggedInStoreName || localStorage.getItem('storeName') || sessionStorage.getItem('storeName') || "AL-DAWAA PHARMA";
        
        console.log("🔍 Fetching products for store:", storeName);

        // 1. Fetch all shops
        const shopsRes = await fetch("/api/medisoft/shops", { signal: abortController.signal });
        if (!shopsRes.ok) throw new Error("Failed to fetch shops");
        const shopsData = await shopsRes.json();
        const shops = Array.isArray(shopsData) ? shopsData : shopsData?.body || [];
        
        if (shops.length === 0) {
          setError("No stores found");
          setLoading(false);
          return;
        }

        console.log(`✅ Found ${shops.length} shops`);

        // 2. Find the target store
        const targetStoreName = storeName;
        const targetShop = shops.find(shop => 
          shop.name?.toUpperCase() === targetStoreName.toUpperCase()
        );

        if (!targetShop) {
          setError(`Store "${targetStoreName}" not found`);
          setLoading(false);
          return;
        }

        console.log(`✅ Found target shop: ${targetShop.name} (${targetShop.shopid})`);

        // 3. Set store options (only show target store)
        const storeOptions = shops.map((shop) => {
          const isTarget = shop.name?.toUpperCase() === targetStoreName.toUpperCase();
          return {
            value: shop.shopid,
            label: shop.name || shop.shopid,
            isDisabled: !isTarget,
          };
        });
        setAllStores(storeOptions);

        const targetOption = storeOptions.find(opt => !opt.isDisabled);
        if (targetOption) {
          setSelectedStore(targetOption);
          if (!loggedInStoreId) {
            localStorage.setItem('storeId', targetOption.value);
            setLoggedInStoreId(targetOption.value);
          }
        }

        // 4. Fetch products ONLY for the target store
        console.log(`📦 Fetching products for shop: ${targetShop.shopid}`);
        
        const productsRes = await fetch("/api/medisoft/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId: targetShop.shopid }),
          signal: abortController.signal,
        });

        let products = [];
        if (productsRes.ok) {
          const data = await productsRes.json();
          console.log("📦 Products API response:", data);
          
          // Handle different response formats
          if (Array.isArray(data)) {
            products = data;
          } else if (data?.products && Array.isArray(data.products)) {
            products = data.products;
          } else if (data?.body && Array.isArray(data.body)) {
            products = data.body;
          } else if (data?.data && Array.isArray(data.data)) {
            products = data.data;
          } else {
            // If no products found, try to get from all shops as fallback
            console.warn("⚠️ No products found in target store, trying fallback...");
            products = await fetchAllProductsFallback(shops, targetStoreName, abortController.signal);
          }
        } else {
          console.warn("⚠️ Products API failed, trying fallback...");
          products = await fetchAllProductsFallback(shops, targetStoreName, abortController.signal);
        }

        // 5. Normalize products
        const normalizedProducts = products.map(prod => ({
          ...prod,
          productName: prod.productname || prod.itemname || prod.name || 'Unnamed Product',
          storeName: targetShop.name,
          storeId: targetShop.shopid,
          stock: parseInt(prod.stock ?? prod.availableQty ?? prod.quantity ?? 0),
          mrp: prod.mrp || prod.price || 0,
          rate: prod.rate || prod.price || 0,
        }));

        console.log(`✅ Found ${normalizedProducts.length} products for ${targetStoreName}`);
        setAllProducts(normalizedProducts);
        setFilteredProducts(normalizedProducts.slice(0, 6));
        setLoaded(true);
        
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("❌ Error fetching products:", err);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    // Fallback: fetch from all shops and filter
    async function fetchAllProductsFallback(shops, targetStoreName, signal) {
      console.log("🔄 Fetching from all shops as fallback...");
      const allProducts = [];
      
      for (const shop of shops) {
        try {
          const res = await fetch("/api/medisoft/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shopId: shop.shopid }),
            signal: signal,
          });
          
          if (res.ok) {
            const data = await res.json();
            let products = [];
            if (Array.isArray(data)) products = data;
            else if (data?.products && Array.isArray(data.products)) products = data.products;
            else if (data?.body && Array.isArray(data.body)) products = data.body;
            else if (data?.data && Array.isArray(data.data)) products = data.data;
            
            // Only keep products from target store
            if (shop.name?.toUpperCase() === targetStoreName.toUpperCase()) {
              allProducts.push(...products);
            }
          }
        } catch (err) {
          console.error(`Error fetching from shop ${shop.shopid}:`, err);
        }
      }
      
      console.log(`✅ Fallback found ${allProducts.length} products`);
      return allProducts;
    }

    fetchAllProducts();
    return () => abortController.abort();
  }, [loaded, loggedInStoreName, loggedInStoreId]);

  // Debounce search input
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter products based on debounced term AND selected store
  useEffect(() => {
    if (allProducts.length === 0) return;

    let storeFiltered = allProducts;
    if (selectedStore) {
      storeFiltered = allProducts.filter(p => p.storeId === selectedStore.value);
    }

    if (!debouncedTerm.trim()) {
      setFilteredProducts(storeFiltered.slice(0, 6));
      setShowResults(false);
      return;
    }
    const lower = debouncedTerm.toLowerCase();
    const filtered = storeFiltered.filter(p =>
      (p.productName || p.productname || p.itemname || "").toLowerCase().includes(lower)
    );
    setFilteredProducts(filtered.slice(0, 10));
    setShowResults(true);
  }, [debouncedTerm, allProducts, selectedStore]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Profile dropdown outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // addToCart uses logged-in store
  const addToCart = (product, e) => {
    e.stopPropagation();
    const productName = product.productName || product.productname || product.itemname;

    // Find all stores that sell this product
    const matchingStores = allProducts.filter(p =>
      (p.productName || p.productname || p.itemname) === productName
    );

    // Use logged-in store name
    const targetStoreName = loggedInStoreName || localStorage.getItem('storeName') || sessionStorage.getItem('storeName') || "AL-DAWAA PHARMA";
    const filteredStores = matchingStores.filter(storeProduct => 
      storeProduct.storeName?.toUpperCase() === targetStoreName.toUpperCase()
    );

    // If product not found in logged-in store, show message
    if (filteredStores.length === 0) {
      alert(`This product is not available in ${targetStoreName}`);
      return;
    }

    // Build store list with filtered stores
    const storeItems = filteredStores.map(storeProduct => ({
      storeName: storeProduct.storeName,
      productName: storeProduct.productName || storeProduct.productname || storeProduct.itemname,
      pack: storeProduct.pack || "N/A",
      rate: storeProduct.rate || 0,
      mrp: storeProduct.mrp || 0,
      scheme: storeProduct.scheme || "",
      stock: getStock(storeProduct) > 0 ? "In Stock" : "Out of Stock",
      stockCount: getStock(storeProduct),
      content: storeProduct.content || "Available",
      qtyPerBox: storeProduct.qtyPerBox || storeProduct.pack || 1,
    }));

    setSelectedProduct(product);
    setStoreList(storeItems);
    setShowCart(true);
  };

  return (
    <>
      {/* TOPBAR */}
      <div className="topbar d-flex align-items-center justify-content-between px-3">
        <div className="logo">Live<span>Order</span></div>

        {/* SEARCH BOX with Store Selector */}
        <div className="search-box position-relative" ref={searchRef}>
          <div className="d-flex align-items-center border rounded px-2 py-1 bg-white">
            <span className="me-2 small" style={{ color: "#000", fontWeight: "500" }}>
              Product
            </span>

            <div style={{ minWidth: "160px", marginRight: "8px" }}>
         <Select
           className="store-selector" 
  options={allStores}
  placeholder="All Stores"
  isClearable={true}
  value={selectedStore}
  onChange={(option) => setSelectedStore(option)}
  isOptionDisabled={(option) => option.isDisabled}
  classNamePrefix="react-select"
  styles={{
    control: (provided) => ({
      ...provided,
      border: "none",
      boxShadow: "none",
      minHeight: "30px",
      background: "transparent",
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: "2px",
    }),
    option: (provided, state) => ({
      ...provided,
      color: state.isDisabled ? "#adb5bd" : "#000",
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      backgroundColor: state.isDisabled ? "#f8f9fa" : "transparent",
    }),
    // ✅ ADD THIS – forces the selected value text to dark
    singleValue: (provided) => ({
      ...provided,
      color: "#004a94 !important",
      fontWeight: "500",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#6c757d",
      fontWeight: "400",
    }),
  }}
/>
            </div>

            <input
              type="text"
              className="form-control border-0 shadow-none"
              style={{ color: "#000", background: "transparent", flex: 1 }}
              placeholder={`Search in ${loggedInStoreName || 'store'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => allProducts.length && setShowResults(true)}
            />
          </div>

          {/* DROPDOWN RESULTS */}
          {showResults && (
            <div
              className="search-results-dropdown"
              style={{
                position: "absolute",
                top: "calc(100% + 5px)",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 1000,
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              <div
                className="d-flex justify-content-between align-items-center px-3 py-2"
                style={{ background: "#f8f9fa", borderBottom: "1px solid #eee" }}
              >
                <span style={{ fontSize: "13px", fontWeight: "500", color: "#000" }}>
                  {searchTerm ? "Search Results" : "Recent Search"}
                </span>
                <span
                  style={{ fontSize: "12px", cursor: "pointer", color: "#0d6efd" }}
                  onClick={() => {
                    setSearchTerm("");
                    const storeProducts = allProducts.filter(p => 
                      p.storeName?.toUpperCase() === (loggedInStoreName || "AL-DAWAA PHARMA").toUpperCase()
                    );
                    setFilteredProducts(storeProducts.slice(0, 6));
                  }}
                >
                  Clear All 🗑
                </span>
              </div>

              <div>
                {loading ? (
                  <div className="text-center p-3" style={{ color: "#000" }}>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Loading products...
                  </div>
                ) : error ? (
                  <div className="text-center p-3 text-danger">⚠️ {error}</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center p-3" style={{ color: "#6c757d" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📦</div>
                    No products found
                    {searchTerm && ` for "${searchTerm}"`}
                  </div>
                ) : (
                  filteredProducts.map((product, idx) => (
                    <div
                      key={idx}
                      className="d-flex align-items-center justify-content-between px-3 py-2"
                      style={{ borderBottom: "1px solid #eee", background: "#fff" }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            background: "#f4f0ff",
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                          }}
                        >
                          💊
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "500", color: "#000" }}>
                            {product.productName || product.productname || product.itemname}
                          </div>
                          <div style={{ fontSize: "12px", color: "#555" }}>
                            {product.manufacturer || "Manufacturer"} • {product.storeName || "Store"}
                          </div>
                        </div>
                      </div>
                      <div className="text-end">
                        <div style={{ fontSize: "12px", color: "#555" }}>
                          Stock: {getStock(product)} | Qty/Box: {product.qtyPerBox || product.pack || 1}
                        </div>
                        <button
                          className="btn btn-sm mt-1"
                          style={{
                            border: "1px solid #00b894",
                            color: getStock(product) > 0 ? "#00b894" : "#dc3545",
                            background: "#fff",
                            borderRadius: "6px",
                            padding: "3px 14px",
                            fontSize: "12px",
                          }}
                          onClick={(e) => addToCart(product, e)}
                          disabled={getStock(product) <= 0}
                        >
                          {getStock(product) > 0 ? "Add" : "Out of Stock"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT ICONS */}
        <div className="d-flex align-items-center position-relative" ref={dropdownRef}>
          <span className="icon me-3 position-relative">
            <i className="bi bi-heart"></i>
            <span className="badge-icon">0</span>
          </span>
          <span className="icon me-3 position-relative">
            <i className="bi bi-bell"></i>
            <span className="badge-icon">3</span>
          </span>
          <span
            className="icon me-3 position-relative"
            onClick={() => router.push("/pharma-dashboard/cartPage")}
            style={{ cursor: "pointer" }}
          >
            <i className="bi bi-cart"></i>
          </span>
          <div className="profile-box" onClick={() => setOpen(!open)}>
            <img src="https://i.pravatar.cc/40" alt="profile" className="profile-img" />
          </div>
          {open && (
            <div className="profile-dropdown">
              <p className="dropdown-item" onClick={() => router.push("/pharma-dashboard/profile")}>My Profile</p>
              <div className="dropdown-item d-flex justify-content-between align-items-center">
                <span>PreFill Last Qty</span>
                <input type="checkbox" />
              </div>
              <p className="dropdown-item">Item Mapping</p>
              <p className="dropdown-item text-danger" onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('storeId');
                localStorage.removeItem('storeName');
                localStorage.removeItem('storeEmail');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('storeId');
                sessionStorage.removeItem('storeName');
                sessionStorage.removeItem('storeEmail');
                router.push('/login');
              }}>Sign Out</p>
            </div>
          )}
        </div>
      </div>

      {/* MENU BAR */}
      <div className="menu-bar d-flex justify-content-between align-items-center px-3">
        <div className="menu-left d-flex align-items-center gap-4">
          <div className="menu-item">All Product <span className="arrow">⌄</span></div>
          <div className="menu-item">Orders <span className="arrow">⌄</span></div>
          <div className="menu-item">Outstanding <span className="arrow">⌄</span></div>
          <div className="menu-item">Manage Returns <span className="arrow">⌄</span></div>
          <div className="menu-item">Invoices</div>
          <div className="menu-item">Support & Ticket <span className="arrow">⌄</span></div>
        </div>
        <div className="menu-right d-flex align-items-center gap-3">
          <span className="menu-link">Manage License</span>
          <button className="seller-btn">Seller List</button>
          <span className="menu-link">Touch Store ↗</span>
        </div>
      </div>

      {/* CART SIDEBAR */}
      <CartSidebar
        show={showCart}
        onHide={() => setShowCart(false)}
        selectedProduct={selectedProduct}
        storeList={storeList}
      />
    </>
  );
}