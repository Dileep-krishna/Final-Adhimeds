"use client";
import React from "react";
import "./store-dashboard.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

// Sample data
const salesData = [
  { month: "Jan", sales: 0.4 },
  { month: "Feb", sales: 0.6 },
  { month: "Mar", sales: 0.3 },
  { month: "Apr", sales: 0.8 },
  { month: "May", sales: 0.5 },
  { month: "Jun", sales: 0.7 },
  { month: "Jul", sales: 0.9 },
  { month: "Aug", sales: 0.6 },
  { month: "Sep", sales: 0.4 },
  { month: "Oct", sales: 0.7 },
  { month: "Nov", sales: 0.5 },
  { month: "Dec", sales: 0.3 },
];

const categoryData = [
  { name: "Electronics", count: 60 },
  { name: "Clothing", count: 45 },
  { name: "Home", count: 30 },
  { name: "Books", count: 20 },
  { name: "Toys", count: 15 },
];

const COLORS = ["#4f46e5", "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444"];

export default function StoreDashboard() {
  return (
    <div className="store-dashboard">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">Dashboard</h2>
      </div>

      {/* Stats Row */}
      <div className="row g-4 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="store-stat-card">
            <div className="store-stat-icon bg-primary-subtle text-primary">
              <i className="bi bi-box"></i>
            </div>
            <div>
              <div className="store-stat-label">Products</div>
              <div className="store-stat-value">12,851</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="store-stat-card">
            <div className="store-stat-icon bg-success-subtle text-success">
              <i className="bi bi-currency-dollar"></i>
            </div>
            <div>
              <div className="store-stat-label">Revenue</div>
              <div className="store-stat-value">$8,420</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="store-stat-card">
            <div className="store-stat-icon bg-warning-subtle text-warning">
              <i className="bi bi-cart"></i>
            </div>
            <div>
              <div className="store-stat-label">Orders</div>
              <div className="store-stat-value">1,204</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="store-stat-card">
            <div className="store-stat-icon bg-danger-subtle text-danger">
              <i className="bi bi-people"></i>
            </div>
            <div>
              <div className="store-stat-label">Customers</div>
              <div className="store-stat-value">843</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Chart & Category Wise */}
      <div className="row g-4 mb-4">
        {/* Sales Chart */}
        <div className="col-lg-8">
          <div className="store-card">
            <h5 className="fw-semibold mb-3 text-primary">
              <i className="bi bi-graph-up me-2 text-primary"></i>Sales Stat
            </h5>
            <div style={{ height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} domain={[0, 1]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                    }}
                    labelStyle={{ color: "var(--text-primary)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--accent)"
                    strokeWidth={2.5}
                    dot={{ fill: "var(--accent)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Category Wise Product Count */}
        <div className="col-lg-4">
          <div className="store-card">
            <h5 className="fw-semibold mb-3 text-primary">
              <i className="bi bi-pie-chart me-2 text-primary"></i>Category wise product count
            </h5>
            <div style={{ height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <XAxis type="number" stroke="var(--text-secondary)" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--text-secondary)"
                    fontSize={12}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                    }}
                    labelStyle={{ color: "var(--text-primary)" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* This Month Stats & Sold Amount */}
      <div className="row g-4 mb-4">
        <div className="col-md-8">
          <div className="store-card">
            <h5 className="fw-semibold mb-3 text-primary">
              <i className="bi bi-calendar3 me-2 text-primary"></i>This Month
            </h5>
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <div className="store-month-stat">
                  <div className="store-month-label">New Order</div>
                  <div className="store-month-value text-primary">318</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="store-month-stat">
                  <div className="store-month-label">On delivery</div>
                  <div className="store-month-value text-warning">18</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="store-month-stat">
                  <div className="store-month-label">Cancelled</div>
                  <div className="store-month-value text-danger">4</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="store-month-stat">
                  <div className="store-month-label">Delivered</div>
                  <div className="store-month-value text-success">147</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="store-card">
            <h5 className="fw-semibold mb-3 text-primary">
              <i className="bi bi-wallet2 me-2 text-primary"></i>Sold Amount
            </h5>
            <div className="text-center py-2">
              <div className="text-muted small">Your sold amount (current month)</div>
              <div className="display-6 fw-bold text-primary">Rs0.00</div>
              <div className="text-muted small">Last Month: <span className="text-success">Rs0.00</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="d-flex flex-wrap gap-3">
        <button className="btn btn-primary px-4 py-2 rounded-pill fw-semibold">
          <i className="bi bi-credit-card me-2"></i>Money Withdraw
        </button>
        <button className="btn btn-outline-primary px-4 py-2 rounded-pill fw-semibold">
          <i className="bi bi-plus-lg me-2"></i>Add New Product
        </button>
      </div>
    </div>
  );
}