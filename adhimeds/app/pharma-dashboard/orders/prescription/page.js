"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./prescription-orders.css";

const ordersData = [
  {
    id: 1,
    orderCode: "HF99114",
    products: 0,
    customer: "SABU CV",
    amount: 0,
    deliveryStatus: "Pending",
    paymentStatus: "Un-Paid",
    date: "25-09-2026",
  },
  {
    id: 2,
    orderCode: "HF76246",
    products: 0,
    customer: "Hareendran",
    amount: 248.9,
    deliveryStatus: "Pending",
    paymentStatus: "Un-Paid",
    date: "24-09-2026",
  },
  {
    id: 3,
    orderCode: "HF61917",
    products: 0,
    customer: "Hareendran",
    amount: 0,
    deliveryStatus: "Pending",
    paymentStatus: "Un-Paid",
    date: "24-09-2026",
  },
  {
    id: 4,
    orderCode: "HF20459",
    products: 0,
    customer: "Thahira",
    amount: 191.99,
    deliveryStatus: "Pending",
    paymentStatus: "Un-Paid",
    date: "23-09-2026",
  },
  {
    id: 5,
    orderCode: "HF44195",
    products: 0,
    customer: "Mirsana",
    amount: 1642.75,
    deliveryStatus: "Pending",
    paymentStatus: "Un-Paid",
    date: "22-09-2026",
  },
  {
    id: 6,
    orderCode: "HF38137",
    products: 0,
    customer: "Abdul Rasheed",
    amount: 720.99,
    deliveryStatus: "Pending",
    paymentStatus: "Un-Paid",
    date: "21-09-2026",
  },
  {
    id: 7,
    orderCode: "HF51358",
    products: 0,
    customer: "Chandrashekaran",
    amount: 2321.55,
    deliveryStatus: "Pending",
    paymentStatus: "Un-Paid",
    date: "20-09-2026",
  },
];

export default function PrescriptionOrdersPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [deliveryStatus, setDeliveryStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 7;

  /* =========================================
     FILTER
     ========================================= */

  const filteredOrders = useMemo(() => {
    return ordersData.filter((order) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        order.orderCode.toLowerCase().includes(searchValue) ||
        order.customer.toLowerCase().includes(searchValue);

      const matchesPayment =
        paymentStatus === "All" ||
        order.paymentStatus === paymentStatus;

      const matchesDelivery =
        deliveryStatus === "All" ||
        order.deliveryStatus === deliveryStatus;

      return (
        matchesSearch &&
        matchesPayment &&
        matchesDelivery
      );
    });
  }, [search, paymentStatus, deliveryStatus]);

  /* =========================================
     PAGINATION
     ========================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / itemsPerPage)
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const currentOrders = filteredOrders.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  /* =========================================
     STATS
     ========================================= */

  const totalOrders = ordersData.length;

  const pendingOrders = ordersData.filter(
    (order) => order.deliveryStatus === "Pending"
  ).length;

  const paidOrders = ordersData.filter(
    (order) => order.paymentStatus === "Paid"
  ).length;

  const unpaidOrders = ordersData.filter(
    (order) => order.paymentStatus === "Un-Paid"
  ).length;

  const totalAmount = ordersData.reduce(
    (sum, order) => sum + order.amount,
    0
  );

  /* =========================================
     VIEW ORDER
     ========================================= */

  const handleViewOrder = (order) => {
    router.push(
      `/orders/prescription/${order.orderCode}`
    );
  };

  /* =========================================
     FILTER RESET
     ========================================= */

  const clearFilters = () => {
    setSearch("");
    setPaymentStatus("All");
    setDeliveryStatus("All");
    setCurrentPage(1);
  };

  return (
    <div className="prescription-orders-page">

      {/* =====================================
          PAGE HEADER
         ===================================== */}

      <div className="prescription-orders-header">

        <div className="orders-title-section">

          <div className="orders-title-icon">
            📋
          </div>

          <div>
            <h1>
              Prescription Orders
            </h1>

            <p>
              Manage orders created from customer prescriptions
            </p>
          </div>

        </div>

        <button
          className="back-orders-btn"
          onClick={() => router.back()}
        >
          ← Back
        </button>

      </div>


      {/* =====================================
          SUMMARY CARDS
         ===================================== */}

      <div className="order-summary-grid">

        {/* TOTAL */}

        <div className="summary-card total">

          <div className="summary-icon">
            📋
          </div>

          <div className="summary-content">

            <span>
              Total Orders
            </span>

            <strong>
              {totalOrders}
            </strong>

          </div>

        </div>


        {/* PENDING */}

        <div className="summary-card pending">

          <div className="summary-icon">
            ⏳
          </div>

          <div className="summary-content">

            <span>
              Pending Delivery
            </span>

            <strong>
              {pendingOrders}
            </strong>

          </div>

        </div>


        {/* PAID */}

        <div className="summary-card paid">

          <div className="summary-icon">
            ✓
          </div>

          <div className="summary-content">

            <span>
              Paid Orders
            </span>

            <strong>
              {paidOrders}
            </strong>

          </div>

        </div>


        {/* UNPAID */}

        <div className="summary-card unpaid">

          <div className="summary-icon">
            ₹
          </div>

          <div className="summary-content">

            <span>
              Un-Paid Orders
            </span>

            <strong>
              {unpaidOrders}
            </strong>

          </div>

        </div>


        {/* VALUE */}

        <div className="summary-card amount">

          <div className="summary-icon">
            ₹
          </div>

          <div className="summary-content">

            <span>
              Order Value
            </span>

            <strong>
              ₹{totalAmount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </strong>

          </div>

        </div>

      </div>


      {/* =====================================
          MAIN CARD
         ===================================== */}

      <div className="prescription-orders-card">

        {/* ===================================
            CARD TOP
           =================================== */}

        <div className="orders-card-top">

          <div>

            <h2>
              All Prescription Orders
            </h2>

            <span>
              {filteredOrders.length} orders found
            </span>

          </div>

        </div>


        {/* ===================================
            FILTER BAR
           =================================== */}

        <div className="orders-filter-bar">

          {/* SEARCH */}

          <div className="order-search">

            <span>
              🔍
            </span>

            <input
              type="text"
              value={search}
              placeholder="Search order code or customer..."
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />

            {search && (
              <button
                className="search-clear"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
              >
                ×
              </button>
            )}

          </div>


          {/* PAYMENT */}

          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">
              All Payment Status
            </option>

            <option value="Paid">
              Paid
            </option>

            <option value="Un-Paid">
              Un-Paid
            </option>
          </select>


          {/* DELIVERY */}

          <select
            value={deliveryStatus}
            onChange={(e) => {
              setDeliveryStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">
              All Delivery Status
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Processing">
              Processing
            </option>

            <option value="Delivered">
              Delivered
            </option>

            <option value="Cancelled">
              Cancelled
            </option>
          </select>


          {/* CLEAR */}

          {(search ||
            paymentStatus !== "All" ||
            deliveryStatus !== "All") && (
            <button
              className="clear-orders-filter"
              onClick={clearFilters}
            >
              Clear
            </button>
          )}

        </div>


        {/* ===================================
            TABLE
           =================================== */}

        <div className="orders-table-container">

          <table className="prescription-orders-table">

            <thead>

              <tr>

                <th className="number-column">
                  #
                </th>

                <th>
                  Order Code
                </th>

                <th>
                  Products
                </th>

                <th>
                  Customer
                </th>

                <th>
                  Amount
                </th>

                <th>
                  Delivery Status
                </th>

                <th>
                  Payment Status
                </th>

                <th>
                  Date
                </th>

                <th className="options-column">
                  Options
                </th>

              </tr>

            </thead>


            <tbody>

              {currentOrders.length > 0 ? (

                currentOrders.map((order) => (

                  <tr key={order.id}>

                    {/* NUMBER */}

                    <td className="number-cell">
                      {order.id}
                    </td>


                    {/* ORDER CODE */}

                    <td>

                      <button
                        className="order-code"
                        onClick={() =>
                          handleViewOrder(order)
                        }
                      >
                        {order.orderCode}
                      </button>

                    </td>


                    {/* PRODUCTS */}

                    <td>

                      <span className="products-count">
                        {order.products}
                      </span>

                    </td>


                    {/* CUSTOMER */}

                    <td>

                      <div className="customer-cell">

                        <div className="customer-avatar">
                          {order.customer
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <span>
                          {order.customer}
                        </span>

                      </div>

                    </td>


                    {/* AMOUNT */}

                    <td>

                      <span className="order-amount">
                        ₹
                        {order.amount.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                          }
                        )}
                      </span>

                    </td>


                    {/* DELIVERY */}

                    <td>

                      <span
                        className={`delivery-status ${order.deliveryStatus
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >

                        <span className="status-dot"></span>

                        {order.deliveryStatus}

                      </span>

                    </td>


                    {/* PAYMENT */}

                    <td>

                      <span
                        className={`payment-status ${order.paymentStatus
                          .toLowerCase()
                          .replace("-", "")}`}
                      >
                        {order.paymentStatus}
                      </span>

                    </td>


                    {/* DATE */}

                    <td>

                      <div className="order-date">

                        <strong>
                          {order.date}
                        </strong>

                      </div>

                    </td>


                    {/* OPTIONS */}

                    <td>

                      <button
                        className="view-order-btn"
                        onClick={() =>
                          handleViewOrder(order)
                        }
                        title="View order"
                      >
                        <span>
                          👁
                        </span>

                        View
                      </button>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="9"
                    className="orders-empty"
                  >

                    <div className="empty-orders-icon">
                      📋
                    </div>

                    <h3>
                      No prescription orders found
                    </h3>

                    <p>
                      Try changing your search or filters.
                    </p>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* ===================================
            FOOTER
           =================================== */}

        <div className="orders-footer">

          <div className="orders-showing">

            Showing{" "}

            <strong>
              {filteredOrders.length === 0
                ? 0
                : startIndex + 1}
            </strong>

            {" "}to{" "}

            <strong>
              {Math.min(
                startIndex + itemsPerPage,
                filteredOrders.length
              )}
            </strong>

            {" "}of{" "}

            <strong>
              {filteredOrders.length}
            </strong>

            {" "}orders

          </div>


          {/* PAGINATION */}

          <div className="orders-pagination">

            <button
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage(
                  (page) => Math.max(1, page - 1)
                )
              }
            >
              ‹
            </button>


            {Array.from(
              { length: totalPages },
              (_, index) => index + 1
            ).map((page) => (

              <button
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
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      totalPages,
                      page + 1
                    )
                )
              }
            >
              ›
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}