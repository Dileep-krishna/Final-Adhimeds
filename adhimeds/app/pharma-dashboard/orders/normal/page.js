"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SERVERURL from "../../../services/serverURL";
import "./normal-orders.css";
import {
  ArrowLeft,
  Search,
  X,
  Eye,
  RefreshCw,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function NormalOrdersPage() {
  const router = useRouter();

  const [ordersData, setOrdersData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [deliveryFilter, setDeliveryFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // ============================================================
  // GET NORMAL ORDERS
  // ============================================================

  const fetchNormalOrders = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        `${SERVERURL}/api/app/orders/normal`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch orders. Status: ${response.status}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Failed to fetch normal orders"
        );
      }

      setOrdersData(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error("Normal orders API error:", err);

      setError(
        err?.message ||
          "Something went wrong while loading normal orders."
      );

      setOrdersData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNormalOrders();
  }, []);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================================
  // ORDER STATUS
  // ============================================================

  const getDeliveryStatus = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "pending":
        return "Pending";

      case "processing":
        return "Processing";

      case "assigned":
        return "Assigned";

      case "confirmed":
        return "Confirmed";

      case "completed":
      case "delivered":
        return "Delivered";

      case "cancelled":
        return "Cancelled";

      default:
        return status || "Pending";
    }
  };

  // ============================================================
  // PAYMENT STATUS
  // ============================================================
  // Current Order API/model does not contain paymentStatus.
  // Therefore we don't invent payment information.

  const getPaymentStatus = () => {
    return "Un-Paid";
  };

  // ============================================================
  // MAP API DATA
  // ============================================================

  const mappedOrders = useMemo(() => {
    return ordersData.map((order) => {
      const customer = order.customerId || {};
      const store = order.storeId || {};

      const customerName =
        customer.name ||
        customer.phone ||
        "Customer";

      const customerPhone = customer.phone || "";

      const deliveryStatus = getDeliveryStatus(order.status);

      const paymentStatus = getPaymentStatus(order);

      return {
        id: order._id,

        orderCode: order._id
          ? `#${order._id.slice(-8).toUpperCase()}`
          : "#N/A",

        fullOrderId: order._id || "",

        customerName,

        customerPhone,

        customerId:
          typeof order.customerId === "object"
            ? order.customerId?._id
            : order.customerId,

        storeName:
          store.storeName ||
          order.items?.[0]?.storeName ||
          "Store",

        shopid:
          store.shopid ||
          order.shopid ||
          "",

        productsCount: Array.isArray(order.items)
          ? order.items.length
          : 0,

        amount: Number(order.total || 0),

        deliveryStatus,

        paymentStatus,

        status: order.status || "pending",

        orderType: order.orderType || "normal",

        prescriptionId:
          order.prescriptionId || null,

        createdAt: order.createdAt,

        updatedAt: order.updatedAt,

        date: formatDate(order.createdAt),

        time: formatTime(order.createdAt),

        rawOrder: order,
      };
    });
  }, [ordersData]);

  // ============================================================
  // FILTER ORDERS
  // ============================================================

  const filteredOrders = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return mappedOrders.filter((order) => {
      const matchesSearch =
        !search ||
        order.orderCode
          .toLowerCase()
          .includes(search) ||
        order.fullOrderId
          .toLowerCase()
          .includes(search) ||
        order.customerName
          .toLowerCase()
          .includes(search) ||
        order.customerPhone
          .toLowerCase()
          .includes(search) ||
        order.storeName
          .toLowerCase()
          .includes(search);

      const matchesPayment =
        paymentFilter === "All" ||
        order.paymentStatus === paymentFilter;

      const matchesDelivery =
        deliveryFilter === "All" ||
        order.deliveryStatus === deliveryFilter;

      return (
        matchesSearch &&
        matchesPayment &&
        matchesDelivery
      );
    });
  }, [
    mappedOrders,
    searchTerm,
    paymentFilter,
    deliveryFilter,
  ]);

  // ============================================================
  // PAGINATION
  // ============================================================

  const totalPages = Math.ceil(
    filteredOrders.length / itemsPerPage
  );

  const paginatedOrders = useMemo(() => {
    const startIndex =
      (currentPage - 1) * itemsPerPage;

    return filteredOrders.slice(
      startIndex,
      startIndex + itemsPerPage
    );
  }, [
    filteredOrders,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    paymentFilter,
    deliveryFilter,
  ]);

  // ============================================================
  // SUMMARY
  // ============================================================

  const summary = useMemo(() => {
    const total = mappedOrders.length;

    const pending = mappedOrders.filter(
      (order) =>
        String(order.status).toLowerCase() === "pending"
    ).length;

    const processing = mappedOrders.filter(
      (order) =>
        String(order.status).toLowerCase() === "processing"
    ).length;

    const completed = mappedOrders.filter(
      (order) =>
        String(order.status).toLowerCase() === "completed" ||
        String(order.status).toLowerCase() === "delivered"
    ).length;

    const cancelled = mappedOrders.filter(
      (order) =>
        String(order.status).toLowerCase() === "cancelled"
    ).length;

    const totalAmount = mappedOrders.reduce(
      (sum, order) => sum + Number(order.amount || 0),
      0
    );

    return {
      total,
      pending,
      processing,
      completed,
      cancelled,
      totalAmount,
    };
  }, [mappedOrders]);

  // ============================================================
  // CLEAR FILTERS
  // ============================================================

  const clearFilters = () => {
    setSearchTerm("");
    setPaymentFilter("All");
    setDeliveryFilter("All");
    setCurrentPage(1);
  };

  const hasFilters =
    searchTerm ||
    paymentFilter !== "All" ||
    deliveryFilter !== "All";

  // ============================================================
  // VIEW ORDER
  // ============================================================

  const handleViewOrder = (order) => {
    if (!order.id) return;

    router.push(`/orders/normal/${order.id}`);
  };

  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "pending":
        return "pending";

      case "processing":
        return "processing";

      case "assigned":
        return "assigned";

      case "confirmed":
        return "confirmed";

      case "completed":
      case "delivered":
        return "completed";

      case "cancelled":
        return "cancelled";

      default:
        return "pending";
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="normal-orders-page">
        <div
          style={{
            minHeight: "500px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <RefreshCw
            size={28}
            className="animate-spin"
          />

          <p>Loading normal orders...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="normal-orders-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="normal-orders-header">

        <div className="normal-title-section">

          <button
            className="normal-back-btn"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1>Normal Orders</h1>

            <p>
              Manage and track all normal medicine orders
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={() => fetchNormalOrders(true)}
          disabled={refreshing}
          className="normal-refresh-btn"
        >
          <RefreshCw
            size={17}
            className={
              refreshing ? "animate-spin" : ""
            }
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            borderRadius: "10px",
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            color: "#be123c",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => fetchNormalOrders()}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "inherit",
              fontWeight: 600,
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="normal-summary-grid">

        <div className="normal-summary-card">
          <div className="normal-summary-icon">
            <ShoppingBag size={22} />
          </div>

          <div className="normal-summary-content">
            <span>Total Orders</span>
            <strong>{summary.total}</strong>
          </div>
        </div>

        <div className="normal-summary-card">
          <div className="normal-summary-icon">
            <Clock size={22} />
          </div>

          <div className="normal-summary-content">
            <span>Pending</span>
            <strong>{summary.pending}</strong>
          </div>
        </div>

        <div className="normal-summary-card">
          <div className="normal-summary-icon">
            <Package size={22} />
          </div>

          <div className="normal-summary-content">
            <span>Processing</span>
            <strong>{summary.processing}</strong>
          </div>
        </div>

        <div className="normal-summary-card">
          <div className="normal-summary-icon">
            <CheckCircle size={22} />
          </div>

          <div className="normal-summary-content">
            <span>Completed</span>
            <strong>{summary.completed}</strong>
          </div>
        </div>

        <div className="normal-summary-card">
          <div className="normal-summary-icon">
            <XCircle size={22} />
          </div>

          <div className="normal-summary-content">
            <span>Cancelled</span>
            <strong>{summary.cancelled}</strong>
          </div>
        </div>

      </div>

      {/* ======================================================
          ORDERS CARD
      ====================================================== */}

      <div className="normal-orders-card">

        <div className="normal-orders-card-header">

          <div>
            <h2>All Normal Orders</h2>

            <p>
              {filteredOrders.length} order
              {filteredOrders.length !== 1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>

          <div
            style={{
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Total: ₹
            {summary.totalAmount.toLocaleString(
              "en-IN",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </div>

        </div>

        {/* ====================================================
            FILTER BAR
        ==================================================== */}

        <div className="normal-filter-bar">

          {/* SEARCH */}

          <div className="normal-order-search">

            <Search
              size={18}
              className="normal-search-icon"
            />

            <input
              type="text"
              placeholder="Search order, customer, phone or store..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />

            {searchTerm && (
              <button
                type="button"
                className="normal-search-clear"
                onClick={() => setSearchTerm("")}
              >
                <X size={16} />
              </button>
            )}

          </div>

          {/* PAYMENT FILTER */}

          <select
            value={paymentFilter}
            onChange={(e) =>
              setPaymentFilter(e.target.value)
            }
          >
            <option value="All">
              All Payment
            </option>

            <option value="Un-Paid">
              Un-Paid
            </option>

            <option value="Paid">
              Paid
            </option>
          </select>

          {/* DELIVERY FILTER */}

          <select
            value={deliveryFilter}
            onChange={(e) =>
              setDeliveryFilter(e.target.value)
            }
          >
            <option value="All">
              All Delivery Status
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Confirmed">
              Confirmed
            </option>

            <option value="Processing">
              Processing
            </option>

            <option value="Assigned">
              Assigned
            </option>

            <option value="Delivered">
              Delivered
            </option>

            <option value="Cancelled">
              Cancelled
            </option>
          </select>

          {hasFilters && (
            <button
              type="button"
              className="normal-clear-filter"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}

        </div>

        {/* ====================================================
            TABLE
        ==================================================== */}

        <div className="normal-table-container">

          <table className="normal-orders-table">

            <thead>
              <tr>

                <th className="normal-number-column">
                  #
                </th>

                <th>
                  Order
                </th>

                <th>
                  Customer
                </th>

                <th>
                  Store
                </th>

                <th>
                  Products
                </th>

                <th>
                  Amount
                </th>

                <th>
                  Payment
                </th>

                <th>
                  Delivery Status
                </th>

                <th>
                  Date
                </th>

                <th>
                  Action
                </th>

              </tr>
            </thead>

            <tbody>

              {paginatedOrders.length > 0 ? (
                paginatedOrders.map(
                  (order, index) => {

                    const serialNumber =
                      (currentPage - 1) *
                        itemsPerPage +
                      index +
                      1;

                    return (
                      <tr key={order.id}>

                        {/* NUMBER */}

                        <td className="normal-number-cell">
                          {serialNumber}
                        </td>

                        {/* ORDER */}

                        <td>
                          <div className="normal-order-code">
                            {order.orderCode}
                          </div>

                          <div
                            style={{
                              fontSize: "11px",
                              color: "#94a3b8",
                              marginTop: "4px",
                              maxWidth: "120px",
                              overflow: "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap",
                            }}
                            title={order.fullOrderId}
                          >
                            {order.fullOrderId}
                          </div>
                        </td>

                        {/* CUSTOMER */}

                        <td>

                          <div className="normal-customer-cell">

                            <div className="normal-customer-avatar">
                              {order.customerName
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <div>
                                {order.customerName}
                              </div>

                              {order.customerPhone && (
                                <div
                                  style={{
                                    fontSize:
                                      "12px",
                                    color:
                                      "#64748b",
                                    marginTop:
                                      "3px",
                                  }}
                                >
                                  {
                                    order.customerPhone
                                  }
                                </div>
                              )}
                            </div>

                          </div>

                        </td>

                        {/* STORE */}

                        <td>
                          <div
                            style={{
                              fontWeight: 600,
                            }}
                          >
                            {order.storeName}
                          </div>

                          {order.shopid && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#64748b",
                                marginTop: "3px",
                              }}
                            >
                              Shop ID:{" "}
                              {order.shopid}
                            </div>
                          )}
                        </td>

                        {/* PRODUCTS */}

                        <td>
                          <span className="normal-products-count">
                            {order.productsCount}
                          </span>
                        </td>

                        {/* AMOUNT */}

                        <td>
                          <div className="normal-order-amount">
                            ₹
                            {order.amount.toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits:
                                  2,
                                maximumFractionDigits:
                                  2,
                              }
                            )}
                          </div>
                        </td>

                        {/* PAYMENT */}

                        <td>
                          <span className="normal-payment-status">
                            {order.paymentStatus}
                          </span>
                        </td>

                        {/* DELIVERY */}

                        <td>

                          <div
                            className={`normal-delivery-status ${getStatusClass(
                              order.deliveryStatus
                            )}`}
                          >
                            <span className="normal-status-dot"></span>

                            {
                              order.deliveryStatus
                            }
                          </div>

                        </td>

                        {/* DATE */}

                        <td>

                          <div className="normal-order-date">
                            {order.date}
                          </div>

                          {order.time && (
                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#64748b",
                                marginTop:
                                  "3px",
                              }}
                            >
                              {order.time}
                            </div>
                          )}

                        </td>

                        {/* ACTION */}

                        <td className="normal-options-column">

                          <button
                            type="button"
                            className="normal-view-btn"
                            onClick={() =>
                              handleViewOrder(
                                order
                              )
                            }
                            title="View Order"
                          >
                            <Eye size={17} />
                          </button>

                        </td>

                      </tr>
                    );
                  }
                )
              ) : (
                <tr>

                  <td
                    colSpan="10"
                    style={{
                      padding: 0,
                    }}
                  >

                    <div className="normal-empty-state">

                      <div className="normal-empty-icon">
                        <ShoppingBag
                          size={32}
                        />
                      </div>

                      <h3>
                        No normal orders found
                      </h3>

                      <p>
                        {hasFilters
                          ? "Try changing or clearing your filters."
                          : "There are no normal orders available yet."}
                      </p>

                      {hasFilters && (
                        <button
                          type="button"
                          onClick={
                            clearFilters
                          }
                        >
                          Clear Filters
                        </button>
                      )}

                    </div>

                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

        {/* ====================================================
            FOOTER / PAGINATION
        ==================================================== */}

        {filteredOrders.length > 0 && (
          <div className="normal-orders-footer">

            <div className="normal-showing">

              Showing{" "}

              <strong>
                {(currentPage - 1) *
                  itemsPerPage +
                  1}
              </strong>

              {" "}to{" "}

              <strong>
                {Math.min(
                  currentPage *
                    itemsPerPage,
                  filteredOrders.length
                )}
              </strong>

              {" "}of{" "}

              <strong>
                {filteredOrders.length}
              </strong>

              {" "}orders

            </div>

            <div className="normal-pagination">

              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.max(
                        page - 1,
                        1
                      )
                  )
                }
              >
                <ChevronLeft size={17} />
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              )
                .slice(
                  Math.max(
                    currentPage - 3,
                    0
                  ),
                  Math.min(
                    currentPage + 2,
                    totalPages
                  )
                )
                .map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={
                      currentPage === page
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setCurrentPage(page)
                    }
                  >
                    {page}
                  </button>
                ))}

              <button
                type="button"
                disabled={
                  currentPage === totalPages ||
                  totalPages === 0
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.min(
                        page + 1,
                        totalPages
                      )
                  )
                }
              >
                <ChevronRight size={17} />
              </button>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}