"use client";

import { useState, useEffect } from "react";
import "./dashboard.css";

export default function SuperAdminDashboard() {
  const [stats] = useState({
    customers: 93,
    products: 35961,
    sales: 184.9,
    vendors: 68,
    totalOrders: 472,
    pendingOrders: 337,
    placedOrders: 468,
    confirmedOrders: 14,
    processedOrders: 12,
    shippedOrders: 13,
  });

  const [animatedStats, setAnimatedStats] = useState({
    customers: 0,
    products: 0,
    sales: 0,
    vendors: 0,
    totalOrders: 0,
    pendingOrders: 0,
    placedOrders: 0,
    confirmedOrders: 0,
    processedOrders: 0,
    shippedOrders: 0,
  });

  useEffect(() => {
    const duration = 1800;
    const steps = 60;
    const interval = duration / steps;

    Object.keys(animatedStats).forEach((key) => {
      let current = 0;
      const target = stats[key];
      const increment = target / steps;

      const timer = setInterval(() => {
        current += increment;

        if (current >= target) {
          setAnimatedStats((prev) => ({
            ...prev,
            [key]: target,
          }));
          clearInterval(timer);
        } else {
          setAnimatedStats((prev) => ({
            ...prev,
            [key]:
              key === "sales"
                ? Number(current.toFixed(1))
                : Math.floor(current),
          }));
        }
      }, interval);
    });
  }, []);

  return (
    // IMPORTANT: Your parent layout must apply the "dark" or "green" class 
    // to this wrapper for the theme to switch correctly.
    <div className="super-admin-wrapper dashboard-page">
      <div className="dashboard-grid">
        
        {/* --- 1. Customer Card --- */}
        <div className="card c-customer">
          <div className="card-top">
            <div>
              <h3>{animatedStats.customers}</h3>
              <p>Total Customer</p>
            </div>
            <i className="bi bi-people icon-outline"></i>
          </div>
          <div className="card-bottom">
            <div className="sub-item">
              <span className="dot red"></span> Top Customers
            </div>
            <div className="avatars">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="avatar-circle"><i className="bi bi-person-fill"></i></div>
              ))}
            </div>
          </div>
        </div>

        {/* --- 2. Products Card --- */}
        <div className="card c-products">
          <div className="card-top">
            <div>
              <h3>{animatedStats.products.toLocaleString()}</h3>
              <p>Total Products</p>
            </div>
            <i className="bi bi-box icon-outline"></i>
          </div>
          <div className="card-bottom list-view">
            <div className="list-item">
              <span className="dot green"></span> Inhouse Products <span className="val">0</span>
            </div>
            <div className="list-item">
              <span className="dot blue"></span> Sellers Products <span className="val">{animatedStats.products.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* --- 3. Sales Card (Tall) --- */}
        <div className="card c-sales sales-card">
          <div className="card-top">
            <div>
              <h3 className="blue-text">{animatedStats.sales.toFixed(1)}K</h3>
              <p className="blue-text">Total Sales</p>
            </div>
          </div>
          <div className="sales-box">
            <span>Sales this month</span>
            <span>Rs125,495.05</span>
          </div>
          <div className="sales-stat">Sales Stat</div>
          <div className="yearly-sales">
            <span className="dot blue-dot"></span> Yearly Sales
          </div>
          <div className="sales-legend">
            <div className="legend-item">
              <span className="dot purple"></span> In-house Sales <span className="val">Rs0.00</span>
            </div>
            <div className="legend-item">
              <span className="dot green"></span> Sellers Sales <span className="val">Rs125,495.05</span>
            </div>
          </div>
        </div>

        {/* --- 4. Sellers Card (Tall) --- */}
        <div className="card c-sellers">
          <div className="card-top">
            <div>
              <h3>{animatedStats.vendors}</h3>
              <p>Total sellers</p>
            </div>
          </div>
          <div className="card-bottom">
            <div className="sub-item">
              <span className="dot red"></span> Pending Seller <span className="val">3</span>
            </div>
            <div className="sub-item mt-3">
              <span className="dot yellow"></span> Top Sellers
            </div>
            <div className="avatars mt-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="avatar-circle"><i className="bi bi-person-fill"></i></div>
              ))}
            </div>
          </div>
          <div className="action-buttons">
            <button className="btn-light-green">All Sellers</button>
            <button className="btn-light-pink">Pending Sellers</button>
          </div>
        </div>

        {/* --- 5. Category Card --- */}
        <div className="card c-category">
          <div className="card-top">
            <div>
              <h3>3</h3>
              <p>Total Category</p>
            </div>
            <i className="bi bi-grid-3x3-gap icon-outline"></i>
          </div>
          <div className="card-bottom list-view">
            <div className="list-item">
              <span className="dash red-dash"></span> Not Found <span className="val">Rs527,117.69</span>
            </div>
          </div>
        </div>

        {/* --- 6. Brands Card --- */}
        <div className="card c-brands">
          <div className="card-top">
            <div>
              <h3>109</h3>
              <p>Total Brands</p>
            </div>
            <i className="bi bi-tag icon-outline"></i>
          </div>
          <div className="card-bottom list-view">
            <div className="sub-item mb-2">Top Brands</div>
            <div className="list-item"><span className="dot green"></span> Not Found <span className="val">Rs495,466.69</span></div>
            <div className="list-item"><span className="dot blue"></span> Not Found <span className="val">Rs23,974.00</span></div>
            <div className="list-item"><span className="dot purple"></span> AL BABA <span className="val">Rs6,807.00</span></div>
          </div>
        </div>

        {/* --- 7. ORDERS SECTION (Full Width) --- */}
        <div className="orders-wrapper">
          <div className="order-section-inner">
            
            {/* Left Column */}
            <div className="order-left-col">
              <div className="order-box purple-stat">
                <div className="stat-text-group">
                  <h3>{animatedStats.totalOrders}</h3>
                  <p>Total Order</p>
                </div>
              </div>
              
              <div className="order-box red-pending">
                <i className="bi bi-clock-history"></i>
                <div className="stat-text-group white-text">
                  <span>Pending order</span>
                  <h4>{animatedStats.pendingOrders}</h4>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="order-right-col">
              
              <div className="order-item blue-item">
                <i className="bi bi-bag-check"></i>
                <div className="item-info">
                  <span>Order placed</span>
                  <span className="num blue-text">{animatedStats.placedOrders}</span>
                </div>
              </div>

              <div className="order-item green-item">
                <i className="bi bi-receipt"></i>
                <div className="item-info">
                  <span>Confirmed Order</span>
                  <span className="num green-text">{animatedStats.confirmedOrders}</span>
                </div>
              </div>

              <div className="order-item pink-item">
                <i className="bi bi-box-seam"></i>
                <div className="item-info">
                  <span>Processed Order</span>
                  <span className="num red-text">{animatedStats.processedOrders}</span>
                </div>
              </div>

              <div className="order-item yellow-item">
                <i className="bi bi-truck"></i>
                <div className="item-info">
                  <span>Order Shipped</span>
                  <span className="num yellow-text">{animatedStats.shippedOrders}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}