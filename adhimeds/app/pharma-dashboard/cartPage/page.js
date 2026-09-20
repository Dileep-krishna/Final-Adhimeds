"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { useCart } from "@/context/CartContext";
import { useOrderNotifications } from "@/context/OrderNotificationContext";
import { toast } from "sonner";
import { placeOrder } from "../../services/orderAPI";
import { getShopsForOrderAPI } from "../../services/storeManagementAPI";
import "./cart.css";

export default function CartPage() {
  const { cartItems, updateQuantity, removeItem, clearCart } = useCart();
  const { triggerNewOrder } = useOrderNotifications();
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    console.log("🛒 Checkout initiated. Cart items:", cartItems);

    if (cartItems.length === 0) {
      toast.error("Your cart is empty.");
      console.warn("❌ Cart empty – checkout aborted.");
      return;
    }

    const originalStoreName = cartItems[0]?.storeName;
    if (!originalStoreName) {
      toast.error("Store name not found in cart. Please add items from a valid store.");
      console.error("❌ No storeName found in cart items.");
      return;
    }
    console.log(`🏪 Original store name from cart: ${originalStoreName}`);

    const allItemsMatch = cartItems.every(item => item.storeName === originalStoreName);
    if (!allItemsMatch) {
      toast.error("Cart contains items from multiple stores. Please clear and try again.");
      console.error("❌ Multiple stores in cart:", cartItems.map(i => i.storeName));
      return;
    }

    // ✅ Check if pharmacist is logged in
    const staffDistrict = localStorage.getItem('staffDistrict') || sessionStorage.getItem('staffDistrict');
    console.log(`👤 Staff district from storage: ${staffDistrict || 'None'}`);

    let shopid = localStorage.getItem('shopid') || sessionStorage.getItem('shopid');
    console.log(`🔑 Current shopid from storage: ${shopid || 'None'}`);

    // ✅ We will create a new items array that may have a different storeName
    let orderItems = [...cartItems];
    let finalStoreName = originalStoreName;

    // ✅ If pharmacist district exists, try to find a store in that district
    if (staffDistrict) {
      console.log(`🔍 Pharmacist district detected: ${staffDistrict}. Routing order to a store in this district...`);

      try {
        const stores = await getShopsForOrderAPI();
        console.log(`📦 Full API response:`, JSON.stringify(stores, null, 2));
        console.log(`📦 Total stores fetched: ${stores.length}`);

        console.log(`📋 Store list with fields:`);
        stores.forEach(s => {
          console.log(`   - ${s.name} | district: ${s.district || 'MISSING'} | status: ${s.status || 'MISSING'} | shopid: ${s.shopid || 'EMPTY'}`);
        });

        // 1st try: active store in the district
        let matchedStore = stores.find(store => 
          store.district?.toUpperCase() === staffDistrict.toUpperCase() && 
          store.status === 'active'
        );

        if (matchedStore) {
          // ✅ Check if shopid is not empty
          if (matchedStore.shopid && matchedStore.shopid.trim() !== '') {
            shopid = matchedStore.shopid;
            finalStoreName = matchedStore.name;
            console.log(`✅ Found ACTIVE store in district ${staffDistrict}: ${finalStoreName} (shopid: ${shopid})`);
            // Override all cart items to use this store
            orderItems = cartItems.map(item => ({
              ...item,
              storeName: finalStoreName,
            }));
            toast.success(`Order will be fulfilled by ${finalStoreName}`);
          } else {
            console.warn(`⚠️ Matched store has empty shopid. Falling back to original store.`);
            // Keep original store
            finalStoreName = originalStoreName;
            shopid = shopid || "30";
            toast.warning(`Store in district has no Shop ID. Using original store.`);
          }
        } else {
          // 2nd try: any store in the district (ignore status)
          const anyInDistrict = stores.filter(s => s.district?.toUpperCase() === staffDistrict.toUpperCase());
          if (anyInDistrict.length > 0) {
            matchedStore = anyInDistrict[0];
            if (matchedStore.shopid && matchedStore.shopid.trim() !== '') {
              shopid = matchedStore.shopid;
              finalStoreName = matchedStore.name;
              console.warn(`⚠️ No active store, but using first store in district: ${finalStoreName} (shopid: ${shopid})`);
              orderItems = cartItems.map(item => ({
                ...item,
                storeName: finalStoreName,
              }));
              toast.warning(`Using store: ${finalStoreName} (status: ${matchedStore.status})`);
            } else {
              console.warn(`⚠️ Store in district has empty shopid. Keeping original store.`);
              finalStoreName = originalStoreName;
              shopid = shopid || "30";
              toast.warning(`Using original store.`);
            }
          } else {
            // No store in district at all – keep original store
            console.warn(`⚠️ No stores found in district "${staffDistrict}". Keeping original store.`);
            finalStoreName = originalStoreName;
            shopid = shopid || "30";
            toast.warning(`No store in ${staffDistrict}. Using original store.`);
          }
        }

        // Save shopid for future use
        if (shopid && shopid.trim() !== '') {
          localStorage.setItem('shopid', shopid);
          console.log(`💾 shopid saved to localStorage: ${shopid}`);
        }
      } catch (err) {
        console.error("🔥 Network error while fetching stores:", err);
        toast.error("Network error. Please try again.");
        return;
      }
    } else {
      // 👇 No pharmacist logged in – use original store
      console.log(`👤 No pharmacist logged in – using store from cart.`);
      // Ensure we have a shopid for the original store
      if (!shopid) {
        try {
          const shops = await getShopsForOrderAPI();
          const matchedShop = shops.find(shop => 
            shop.name?.toUpperCase() === originalStoreName.toUpperCase()
          );
          if (matchedShop && matchedShop.shopid && matchedShop.shopid.trim() !== '') {
            shopid = matchedShop.shopid;
            localStorage.setItem('shopid', shopid);
            console.log(`✅ Auto‑fetched shopid: ${shopid} for store: ${matchedShop.name}`);
          } else {
            shopid = "30";
            console.warn(`⚠️ Using default shopid: ${shopid}`);
          }
        } catch (err) {
          console.error("🔥 Network error while fetching shops:", err);
          toast.error("Network error. Please try again.");
          return;
        }
      }
      finalStoreName = originalStoreName;
      orderItems = cartItems; // unchanged
    }

    // ✅ Ensure shopid is not empty
    if (!shopid || shopid.trim() === '') {
      shopid = "30";
      console.warn(`⚠️ shopid empty, using default: ${shopid}`);
      localStorage.setItem('shopid', shopid);
    }

    console.log(`🎯 Final store name: ${finalStoreName}`);
    console.log(`🎯 Final shopid: ${shopid}`);
    console.log(`📦 Order items:`, orderItems);

    // ✅ Proceed with order – use the potentially updated orderItems
    const loadingToast = toast.loading("Placing your order...");
    setIsCheckingOut(true);

    try {
      // Pass the updated items (with possibly overridden storeName)
      const response = await placeOrder(orderItems);

      if (response.success) {
        toast.success("✅ Order placed successfully!", { id: loadingToast });
        console.log(`✅ Order placed successfully. Response:`, response);

        let order = response.order || response.data?.order;

        if (!order) {
          console.warn("⚠️ No order data in response – building from cart items");
          order = {
            _id: response.orderId || `temp-${Date.now()}`,
            items: orderItems.map(item => ({
              _id: item.id,
              productName: item.productName,
              quantity: item.quantity,
              status: "pending",
            })),
            createdAt: new Date().toISOString(),
          };
        }

        if (order.items) {
          order.items = order.items.map(item => ({
            ...item,
            status: item.status || "pending",
          }));
        }

        triggerNewOrder(order);
        clearCart();
        console.log(`🧹 Cart cleared.`);
      } else {
        toast.error(response.message || "Failed to place order.", {
          id: loadingToast,
        });
        console.error(`❌ Order placement failed:`, response);
      }
    } catch (error) {
      toast.error("Network error. Please try again.", { id: loadingToast });
      console.error("🔥 Network error during order placement:", error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="cart-container container-fluid">
      <Navbar />
      <h5 className="mb-4">My Shopping Cart</h5>
      <div className="row">
        <div className="col-md-8">
          <div className="cart-card p-3">
            {cartItems.length === 0 ? (
              <p className="text-muted">Your cart is empty</p>
            ) : (
              cartItems.map((item) => {
                const stock = item.stock ?? 0;
                return (
                  <div
                    key={item.id}
                    className="cart-item-card mb-4 p-3 border rounded shadow-sm bg-white"
                  >
                    <div className="product-header d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="fw-semibold fs-5">{item.productName}</div>
                        <div className="text-muted small">
                          {item.company || "Company Name"}
                        </div>
                        <div className="text-muted small">
                          HSN Code: {item.hsn || "0000"}
                        </div>
                      </div>
                      <div className="product-icon" style={{ fontSize: "2rem" }}>
                        💊
                      </div>
                    </div>

                    <div className="seller-row d-flex justify-content-between align-items-center p-2 bg-light rounded">
                      <div>
                        <div className="fw-semibold">{item.storeName}</div>
                        <div className="small text-muted mt-1">
                          Rate: ₹{item.rate || 0} &nbsp; MRP: ₹{item.mrp || 0}{" "}
                          &nbsp; Stock: {stock}
                        </div>
                        <div className="small text-muted">
                          Qty/Box: {item.qtyPerBox || 1}
                        </div>
                        <div className="small mt-1">
                          <span className={stock > 0 ? "text-success" : "text-danger"}>
                            {stock > 0 ? "✅ Available" : "❌ Out of Stock"}
                          </span>
                        </div>
                      </div>

                      <div className="d-flex flex-column align-items-end">
                        <div className="d-flex align-items-center">
                          <input
                            type="number"
                            className="form-control form-control-sm me-2 qty-input"
                            style={{ width: "70px" }}
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(item.id, Number(e.target.value))
                            }
                          />
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => removeItem(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                        <small className="text-danger mt-1">
                          Qty should be multiple of {item.qtyPerBox || 1}
                        </small>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="col-md-4">
          <div className="summary-card p-3 border rounded shadow-sm bg-white">
            <h6 className="mb-3">Cart Value Details</h6>
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="summary-item d-flex justify-content-between mb-2"
              >
                <span>
                  {item.productName} – {item.storeName}
                </span>
                <span>₹{(item.mrp || 0) * item.quantity}</span>
              </div>
            ))}
            <div className="summary-item d-flex justify-content-between mb-3">
              <span>GST Amount</span>
              <span>₹0.00</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between fw-bold mb-3">
              <span>Total Payable Amount</span>
              <span>
                ₹
                {cartItems.reduce(
                  (total, item) => total + (item.mrp || 0) * item.quantity,
                  0
                )}
              </span>
            </div>
            <button
              className="btn checkout-btn w-100"
              onClick={handleCheckout}
              disabled={isCheckingOut || cartItems.length === 0}
            >
              {isCheckingOut ? "Processing..." : "Proceed To Checkout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}