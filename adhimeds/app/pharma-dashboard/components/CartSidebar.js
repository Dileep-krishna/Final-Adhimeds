"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Offcanvas, Button } from "react-bootstrap";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import "./CartSidebar.css";

export default function CartSidebar({ show, onHide, selectedProduct, storeList }) {
  const router = useRouter();
  const { addItem } = useCart();

  // State: number of packs per store (indexed by store index)
  const [packs, setPacks] = useState({});
  const [adding, setAdding] = useState({});

  // Initialize packs to 1 when storeList changes
  useEffect(() => {
    if (storeList && storeList.length) {
      const initial = {};
      storeList.forEach((_, idx) => (initial[idx] = 1));
      setPacks(initial);
    }
  }, [storeList]);

  // Get maximum packs available for a store
  const getMaxPacks = (store) => {
    return parseInt(store.stockCount) || parseInt(selectedProduct?.stock) || 0;
  };

  // Get qtyPerBox for a store
  const getQtyPerBox = (store) => {
    return parseInt(store.qtyPerBox) || parseInt(selectedProduct?.qtyPerBox) || 1;
  };

  // --- Handler for Packs input ---
  const handlePacksChange = (idx, value, store) => {
    if (value === '') {
      setPacks(prev => ({ ...prev, [idx]: '' }));
      return;
    }

    let qty = parseInt(value);
    if (isNaN(qty) || qty < 1) qty = 1;

    const maxPacks = getMaxPacks(store);
    if (qty > maxPacks && maxPacks > 0) {
      qty = maxPacks;
      toast.warning(`Only ${maxPacks} packs available.`, { className: "custom-toast" });
    }

    setPacks(prev => ({ ...prev, [idx]: qty }));
  };

  const handlePacksBlur = (idx, store) => {
    setPacks(prev => {
      const current = prev[idx];
      if (current === '' || isNaN(parseInt(current)) || parseInt(current) < 1) {
        return { ...prev, [idx]: 1 };
      }
      const qty = parseInt(current);
      const maxPacks = getMaxPacks(store);
      if (qty > maxPacks && maxPacks > 0) {
        toast.warning(`Only ${maxPacks} packs available.`, { className: "custom-toast" });
        return { ...prev, [idx]: maxPacks };
      }
      return prev;
    });
  };

  // --- Handler for Tablets (units) input ---
  const handleTabletsChange = (idx, value, store) => {
    if (value === '') {
      // Optionally clear the packs field? We'll keep packs unchanged.
      return;
    }

    let units = parseInt(value);
    if (isNaN(units) || units < 1) units = 1;

    const qtyPerBox = getQtyPerBox(store);
    // Calculate number of packs needed (ceil division)
    let newPacks = Math.ceil(units / qtyPerBox);
    if (newPacks < 1) newPacks = 1;

    const maxPacks = getMaxPacks(store);
    if (newPacks > maxPacks && maxPacks > 0) {
      newPacks = maxPacks;
      toast.warning(`Only ${maxPacks} packs available (${maxPacks * qtyPerBox} tablets).`, {
        className: "custom-toast",
      });
    }

    setPacks(prev => ({ ...prev, [idx]: newPacks }));
  };

  // --- Add to cart ---
  const handleAddStoreItem = (store, idx) => {
    if (store.stock !== "In Stock") {
      toast.error("This product is out of stock at this store.", { className: "custom-toast" });
      return;
    }

    const packQty = parseInt(packs[idx]) || 1;
    const maxPacks = getMaxPacks(store);

    if (packQty > maxPacks) {
      toast.error(`Only ${maxPacks} packs available. Please reduce quantity.`, { className: "custom-toast" });
      return;
    }

    setAdding(prev => ({ ...prev, [idx]: true }));

    try {
      const qtyPerBox = getQtyPerBox(store);
      const totalUnits = packQty * qtyPerBox;

      const newItem = {
        id: selectedProduct.id || selectedProduct.productId || Math.random().toString(),
        productName: selectedProduct.productname || selectedProduct.itemname || store.productName,
        storeName: store.storeName,
        storeId: store._id,
        shopid: store.shopid,
        mrp: parseFloat(store.mrp) || 0,
        rate: parseFloat(store.rate) || 0,
        quantity: packQty,               // number of packs (backend expects this)
        totalUnits: totalUnits,          // store total units for display
        stock: parseInt(selectedProduct.stock) || 0,
        qtyPerBox: qtyPerBox,
        company: selectedProduct.manufacturer || "",
        hsn: selectedProduct.hsnCode || selectedProduct.hsn || "",
        batch: selectedProduct.batch || "",
        expiry: selectedProduct.expiry || "",
        pack: store.pack || "",
        scheme: store.scheme || "",
        gst: selectedProduct.gst || "0",
      };

      addItem(newItem);
      toast.success(`${newItem.productName} (${totalUnits} tablets) added to cart!`, { className: "custom-toast" });
      onHide();
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.error("Failed to add item. Please try again.", { className: "custom-toast" });
    } finally {
      setAdding(prev => ({ ...prev, [idx]: false }));
    }
  };

  const isProductInStock = parseInt(selectedProduct?.stock) > 0;

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      className="cart-sidebar"
      backdrop={true}
      scroll={false}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Add to Cart</Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body className="cart-sidebar-body">
        {selectedProduct && storeList?.length > 0 && (
          <div>
            {/* PRODUCT HEADER */}
            <div className="product-header d-flex justify-content-between">
              <div>
                <div className="product-title">
                  {selectedProduct.productname || selectedProduct.itemname || "Product"}
                </div>
                <div className="text-muted small">
                  Manufacturer: {selectedProduct.manufacturer || "N/A"}
                </div>
                <div className="text-muted small">
                  Batch: {selectedProduct.batch || "N/A"} &nbsp;|&nbsp; Expiry: {selectedProduct.expiry || "N/A"}
                </div>
                <div className="text-muted small">
                  HSN: {selectedProduct.hsnCode || selectedProduct.hsn || "N/A"} &nbsp;|&nbsp; GST: {selectedProduct.gst || "0"}%
                </div>
                <div className="text-muted small">
                  Stock: <span className={isProductInStock ? "text-success" : "text-danger"}>
                    {isProductInStock ? `✅ ${selectedProduct.stock}` : "❌ Out of Stock"}
                  </span>
                </div>
              </div>
              <div className="product-icon">💊</div>
            </div>

            <div className="d-flex align-items-center mt-3 mb-2">
              <span className="me-2">Available Stock</span>
              <div className="form-check form-switch m-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={isProductInStock}
                  disabled={true}
                />
              </div>
            </div>

            {storeList.map((store, idx) => {
              const isStoreInStock = store.stock === "In Stock";
              const maxPacks = getMaxPacks(store);
              const qtyPerBox = getQtyPerBox(store);
              const currentPacks = parseInt(packs[idx]) || 1;
              const totalUnits = currentPacks * qtyPerBox;

              return (
                <div key={idx} className="store-card-new">
                  <div className="store-header d-flex justify-content-between">
                    <div className="fw-semibold">{store.storeName}</div>
                    <span className={`badge ${isStoreInStock ? "bg-success" : "bg-danger"}`}>
                      {store.stock}
                    </span>
                  </div>

                  <div className="store-details">
                    <div>{store.productName}</div>
                    <div>
                      Pack: {store.pack} | Rate: ₹{store.rate} | MRP: ₹{store.mrp}
                    </div>
                    <div>Scheme: {store.scheme || "—"}</div>
                    <div>Content: {store.content || "Available"}</div>
                    <div>Qty/Box: {qtyPerBox}</div>
                    {isStoreInStock && (
                      <div className="text-muted small">Max Packs: {maxPacks}</div>
                    )}
                  </div>

                  {/* TWO INPUT FIELDS: Packs & Tablets */}
                  <div className="store-actions d-flex align-items-center gap-2">
                    <div className="d-flex align-items-center">
                      <label className="me-1 small">Packs:</label>
                      <input
                        type="number"
                        className="form-control form-control-sm qty-input"
                        style={{ width: '65px' }}
                        min="1"
                        max={maxPacks || 1}
                        value={currentPacks}
                        onChange={(e) => handlePacksChange(idx, e.target.value, store)}
                        onBlur={() => handlePacksBlur(idx, store)}
                        disabled={!isStoreInStock}
                      />
                    </div>
                    <div className="d-flex align-items-center">
                      <label className="me-1 small">Tablets:</label>
                      <input
                        type="number"
                        className="form-control form-control-sm qty-input"
                        style={{ width: '75px' }}
                        min="1"
                        value={totalUnits}
                        onChange={(e) => handleTabletsChange(idx, e.target.value, store)}
                        disabled={!isStoreInStock}
                      />
                    </div>
                    <Button
                      className="add-btn ms-auto"
                      size="sm"
                      onClick={() => handleAddStoreItem(store, idx)}
                      disabled={adding[idx] || !isStoreInStock || currentPacks > maxPacks}
                    >
                      {adding[idx] ? "..." : "Add"}
                    </Button>
                  </div>

                  {currentPacks > maxPacks && isStoreInStock && (
                    <div className="text-danger small mt-1">
                      Quantity exceeds available stock (max: {maxPacks} packs)
                    </div>
                  )}

                  <div className="qty-warning">
                    Each pack contains {qtyPerBox} tablets. Total tablets: {totalUnits}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}