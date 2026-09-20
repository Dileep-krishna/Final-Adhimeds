"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAllOrders } from "../../services/orderAPI";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import "./delivery-dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DeliveryHeadDashboard() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [selectedView, setSelectedView] = useState("overview");

  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await getAllOrders();
      if (!response.success) throw new Error("Failed to load orders");
      return response.data;
    },
    refetchInterval: 30000,
    staleTime: 10000,
    refetchOnWindowFocus: false,
  });

  const calculateStats = () => {
    let totalOrders = 0;
    let pendingOrders = 0;
    let processingOrders = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;
    let totalRevenue = 0;

    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        totalOrders++;
        const itemTotal = (item.mrp || 0) * (item.quantity || 1);

        switch (item.status) {
          case "pending":
            pendingOrders++;
            break;
          case "processing":
            processingOrders++;
            break;
          case "completed":
            completedOrders++;
            totalRevenue += itemTotal;
            break;
          case "cancelled":
            cancelledOrders++;
            break;
          default:
            break;
        }
      });
    });

    const deliveryRate = totalOrders > 0
      ? Math.round((completedOrders / totalOrders) * 100)
      : 0;

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      deliveryRate,
      activeOrders: pendingOrders + processingOrders,
    };
  };

  const stats = calculateStats();

  const statusData = {
    labels: ["Pending", "Processing", "Delivered", "Cancelled"],
    datasets: [
      {
        data: [
          stats.pendingOrders,
          stats.processingOrders,
          stats.completedOrders,
          stats.cancelledOrders,
        ],
        backgroundColor: ["#f59e0b", "#3b82f6", "#22c55e", "#ef4444"],
        borderColor: ["#fff", "#fff", "#fff", "#fff"],
        borderWidth: 2,
      },
    ],
  };

  const revenueData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Revenue",
        data: [12500, 18900, 15200, 22100, 19800, 27600, 24500],
        borderColor: "#0a2b4e",
        backgroundColor: "rgba(10, 43, 78, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const orderTrendData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Orders",
        data: [45, 62, 58, 79, 68, 92, 84],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const recentOrders = orders.slice(0, 5).flatMap((order) =>
    (order.items || []).map((item) => ({
      id: item._id,
      orderId: order._id,
      product: item.productName,
      quantity: item.quantity || 1,
      amount: (item.mrp || 0) * (item.quantity || 1),
      status: item.status,
      createdAt: order.createdAt,
      customer: "Guest",
    }))
  );

  const getStatusBadge = (status) => {
    const map = {
      pending: "dd-badge dd-badge-warning",
      processing: "dd-badge dd-badge-info",
      completed: "dd-badge dd-badge-success",
      cancelled: "dd-badge dd-badge-danger",
    };
    return map[status] || "dd-badge dd-badge-secondary";
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const periods = [
    { label: "Today", value: "today" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "This Year", value: "year" },
  ];

  return (
    <div className="dd-page">
      {/* Header */}
      <div className="dd-header">
        <div>
          <h4 className="dd-title">📦 Delivery Dashboard</h4>
          <p className="dd-subtitle">Real-time overview of your delivery operations</p>
        </div>
        <div className="dd-header-actions">
          {periods.map((period) => (
            <button
              key={period.value}
              className={`dd-period-btn ${
                selectedPeriod === period.value ? "dd-period-btn-active" : ""
              }`}
              onClick={() => setSelectedPeriod(period.value)}
            >
              {period.label}
            </button>
          ))}
          <button className="dd-refresh-btn" onClick={() => refetch()}>
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dd-stats-grid">
        <div className="dd-stat-card dd-stat-card-primary">
          <div className="dd-stat-card-content">
            <p className="dd-stat-label">Total Orders</p>
            <h3 className="dd-stat-value">{stats.totalOrders}</h3>
          </div>
          <div className="dd-stat-icon dd-stat-icon-primary">
            <i className="bi bi-cart-check"></i>
          </div>
          <div className="dd-stat-badge dd-stat-badge-primary">+12.5% from last week</div>
        </div>

        <div className="dd-stat-card dd-stat-card-warning">
          <div className="dd-stat-card-content">
            <p className="dd-stat-label">Active Orders</p>
            <h3 className="dd-stat-value">{stats.activeOrders}</h3>
          </div>
          <div className="dd-stat-icon dd-stat-icon-warning">
            <i className="bi bi-clock-history"></i>
          </div>
          <div className="dd-stat-badge dd-stat-badge-warning">
            {stats.pendingOrders} pending · {stats.processingOrders} processing
          </div>
        </div>

        <div className="dd-stat-card dd-stat-card-success">
          <div className="dd-stat-card-content">
            <p className="dd-stat-label">Delivered</p>
            <h3 className="dd-stat-value">{stats.completedOrders}</h3>
          </div>
          <div className="dd-stat-icon dd-stat-icon-success">
            <i className="bi bi-check-circle"></i>
          </div>
          <div className="dd-stat-badge dd-stat-badge-success">
            {stats.deliveryRate}% delivery rate
          </div>
        </div>

        <div className="dd-stat-card dd-stat-card-info">
          <div className="dd-stat-card-content">
            <p className="dd-stat-label">Total Revenue</p>
            <h3 className="dd-stat-value">₹{stats.totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="dd-stat-icon dd-stat-icon-info">
            <i className="bi bi-currency-rupee"></i>
          </div>
          <div className="dd-stat-badge dd-stat-badge-info">
            From {stats.completedOrders} deliveries
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="dd-charts-grid">
        <div className="dd-chart-card">
          <h6 className="dd-chart-title">Order Status Distribution</h6>
          <div className="dd-chart-container">
            {stats.totalOrders > 0 ? (
              <Doughnut
                data={statusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        padding: 10,
                        usePointStyle: true,
                        pointStyle: "circle",
                      },
                    },
                  },
                  cutout: "60%",
                }}
              />
            ) : (
              <div className="dd-chart-empty">
                <i className="bi bi-pie-chart fs-1"></i>
                <p className="mt-2">No data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="dd-chart-card">
          <h6 className="dd-chart-title">Revenue Trend</h6>
          <div className="dd-chart-container">
            <Line
              data={revenueData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => "₹" + value.toLocaleString(),
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="dd-chart-card">
          <h6 className="dd-chart-title">Order Trend</h6>
          <div className="dd-chart-container">
            <Line
              data={orderTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { stepSize: 20 },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dd-actions-card">
        <h6 className="dd-actions-title">Quick Actions</h6>
        <div className="dd-actions-group">
          <button
            className="dd-action-btn dd-action-btn-dark"
            onClick={() => router.push("/All-store-management/Order-Requests")}
          >
            <i className="bi bi-plus-circle me-2"></i>View Pending Orders
          </button>
          <button
            className="dd-action-btn dd-action-btn-outline-primary"
            onClick={() => router.push("/All-store-management/All-Orders")}
          >
            <i className="bi bi-list me-2"></i>All Orders
          </button>
          <button
            className="dd-action-btn dd-action-btn-outline-success"
            onClick={() => router.push("/All-store-management/delivery-tracker")}
          >
            <i className="bi bi-truck me-2"></i>Delivery Tracker
          </button>
          <button
            className="dd-action-btn dd-action-btn-outline-secondary"
            onClick={() => refetch()}
          >
            <i className="bi bi-arrow-repeat me-2"></i>Sync Data
          </button>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="dd-table-card">
        <div className="dd-table-header">
          <h6 className="dd-table-title">Recent Orders</h6>
          <button
            className="dd-table-view-link"
            onClick={() => router.push("/All-store-management/All-Orders")}
          >
            View All <i className="bi bi-chevron-right"></i>
          </button>
        </div>

        {isLoading ? (
          <div className="dd-loading">
            <div className="spinner-border text-primary" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="dd-empty-state">
            <i className="bi bi-inbox fs-1"></i>
            <p className="mt-2">No orders found</p>
          </div>
        ) : (
          <div className="dd-table-wrapper">
            <table className="dd-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 8).map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span className="dd-order-code">
                        #{order.orderId.substring(order.orderId.length - 8)}
                      </span>
                    </td>
                    <td>{order.product}</td>
                    <td>{order.quantity}</td>
                    <td>₹{order.amount.toFixed(2)}</td>
                    <td>{order.customer}</td>
                    <td className="dd-order-date">{formatDate(order.createdAt)}</td>
                    <td>
                      <span className={getStatusBadge(order.status)}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="dd-view-btn"
                        onClick={() =>
                          router.push(
                            `/All-store-management/orders/${order.orderId}`
                          )
                        }
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}