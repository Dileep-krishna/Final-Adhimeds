"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import "./prescription-list.css";
import SERVERURL from "../../services/serverURL";

export default function PrescriptionListPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("customer");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  /* =========================================================
     API DATA
  ========================================================= */

  const [prescriptions, setPrescriptions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =========================================================
     IMAGE MODAL
  ========================================================= */

  const [showImageModal, setShowImageModal] = useState(false);

  const [selectedPrescription, setSelectedPrescription] =
    useState(null);

  /* =========================================================
     FETCH ALL PRESCRIPTIONS
  ========================================================= */

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${SERVERURL}/api/app/admin/prescriptions`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Failed to fetch prescriptions"
        );
      }

      if (!result.success) {
        throw new Error(
          result?.message ||
            "Failed to fetch prescriptions"
        );
      }

      setPrescriptions(result.data || []);
    } catch (err) {
      console.error(
        "Fetch Prescriptions Error:",
        err
      );

      setError(
        err.message ||
          "Failed to load prescriptions"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LOAD API
  ========================================================= */

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredData = useMemo(() => {
    return prescriptions.filter((item) => {
      const searchText =
        search.toLowerCase().trim();

      const userName =
        item.user?.name ||
        item.userName ||
        item.patientName ||
        "";

      const doctorName =
        item.doctorName || "";

      const customerName =
        item.patientName || "";

      const matchesSearch =
        !searchText ||
        userName
          .toLowerCase()
          .includes(searchText) ||
        doctorName
          .toLowerCase()
          .includes(searchText) ||
        customerName
          .toLowerCase()
          .includes(searchText) ||
        (item.fileName || "")
          .toLowerCase()
          .includes(searchText);

      const apiStatus =
        item.status || "pending";

      const formattedStatus =
        apiStatus.charAt(0).toUpperCase() +
        apiStatus.slice(1);

      const matchesStatus =
        statusFilter === "All" ||
        formattedStatus === statusFilter;

      let matchesDate = true;

      if (dateFilter && item.createdAt) {
        const itemDate =
          new Date(item.createdAt)
            .toISOString()
            .split("T")[0];

        matchesDate =
          itemDate === dateFilter;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    prescriptions,
    search,
    statusFilter,
    dateFilter,
  ]);

  /* =========================================================
     VIEW PRESCRIPTION
  ========================================================= */

  const handleView = (prescription) => {
    setSelectedPrescription(
      prescription
    );

    setShowImageModal(true);
  };

  /* =========================================================
     ORDER
  ========================================================= */

  const handleOrder = (id) => {
    router.push(
      `/orders/prescription/${id}`
    );
  };

  /* =========================================================
     CLOSE IMAGE MODAL
  ========================================================= */

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedPrescription(null);
  };

  /* =========================================================
     IMAGE URL
  ========================================================= */

  const getFileUrl = (fileUrl) => {
    if (!fileUrl) {
      return "";
    }

    /*
     * Convert production HTTP URL to HTTPS.
     */

    if (
      fileUrl.startsWith(
        "http://zoomfresh.co.in"
      )
    ) {
      return fileUrl.replace(
        "http://zoomfresh.co.in",
        "https://zoomfresh.co.in"
      );
    }

    return fileUrl;
  };

  /* =========================================================
     DATE
  ========================================================= */

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };

  /* =========================================================
     TIME
  ========================================================= */

  const formatTime = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );
  };

  /* =========================================================
     STATUS
  ========================================================= */

  const getStatus = (status) => {
    if (!status) {
      return "Pending";
    }

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="prescription-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="prescription-page-header">

        <div>
          <h1>
            Prescription List
          </h1>

          <p>
            Manage customer and doctor
            prescriptions
          </p>
        </div>

        <button
          className="back-btn"
          onClick={() => router.back()}
        >
          ← Back
        </button>

      </div>

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <div className="prescription-card">

        {/* ===================================================
            CARD HEADER
        =================================================== */}

        <div className="prescription-card-header">

          <div>
            <h2>
              All Prescriptions
            </h2>

            <span className="record-count">
              {filteredData.length}{" "}
              prescriptions
            </span>
          </div>

          {/* TABS */}

          <div className="prescription-tabs">

            <button
              className={`prescription-tab ${
                activeTab === "customer"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("customer")
              }
            >
              <span>👤</span>
              Customer Prescriptions
            </button>

            <button
              className={`prescription-tab doctor ${
                activeTab === "doctor"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("doctor")
              }
            >
              <span>🩺</span>
              Doctor Prescriptions
            </button>

          </div>

        </div>

        {/* ===================================================
            FILTER SECTION
        =================================================== */}

        <div className="prescription-filters">

          {/* SEARCH */}

          <div className="prescription-search">

            <span className="search-symbol">
              🔍
            </span>

            <input
              type="text"
              placeholder="Search user, customer, doctor..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                className="clear-search"
                onClick={() =>
                  setSearch("")
                }
              >
                ×
              </button>
            )}

          </div>

          {/* STATUS */}

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >
            <option value="All">
              All Status
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Approved">
              Approved
            </option>

            <option value="Rejected">
              Rejected
            </option>
          </select>

          {/* DATE */}

          <input
            type="date"
            className="filter-date"
            value={dateFilter}
            onChange={(e) =>
              setDateFilter(
                e.target.value
              )
            }
          />

          {/* CLEAR */}

          {(search ||
            statusFilter !== "All" ||
            dateFilter) && (
            <button
              className="clear-filter-btn"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setDateFilter("");
              }}
            >
              Clear
            </button>
          )}

        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div
            style={{
              margin: "20px",
              padding: "15px",
              borderRadius: "10px",
              background: "#fff1f2",
              color: "#be123c",
            }}
          >
            <strong>
              Failed to load prescriptions
            </strong>

            <p>{error}</p>

            <button
              onClick={fetchPrescriptions}
            >
              Try Again
            </button>
          </div>
        )}

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="prescription-table-wrapper">

          <table className="prescription-table">

            <thead>

              <tr>

                <th className="col-number">
                  #
                </th>

                <th>
                  User
                </th>

                <th>
                  Seller
                </th>

                <th>
                  Location
                </th>

                <th>
                  Doctor
                </th>

                <th>
                  Customer
                </th>

                <th className="col-address">
                  Address
                </th>

                <th>
                  Type
                </th>

                <th>
                  Date
                </th>

                <th>
                  Images
                </th>

                <th>
                  Status
                </th>

                <th className="col-action">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="12"
                    className="empty-state"
                  >

                    <div className="empty-icon">
                      ⏳
                    </div>

                    <h3>
                      Loading prescriptions...
                    </h3>

                  </td>

                </tr>

              ) : filteredData.length > 0 ? (

                filteredData.map(
                  (item, index) => {

                    const userName =
                      item.user?.name ||
                      item.userName ||
                      item.patientName ||
                      "-";

                    const doctor =
                      item.doctorName ||
                      "-";

                    const customer =
                      item.patientName ||
                      "-";

                    const status =
                      getStatus(
                        item.status
                      );

                    const fileUrl =
                      getFileUrl(
                        item.fileUrl
                      );

                    return (

                      <tr
                        key={item._id}
                      >

                        {/* NUMBER */}

                        <td className="number-cell">
                          {index + 1}
                        </td>

                        {/* USER */}

                        <td>

                          <div className="user-cell">

                            <div className="user-avatar">

                              {userName
                                .charAt(0)
                                .toUpperCase()}

                            </div>

                            <span>
                              {userName}
                            </span>

                          </div>

                        </td>

                        {/* SELLER */}

                        <td>

                          <div className="seller-cell">

                            <strong>
                              -
                            </strong>

                            <span>
                              Not available
                            </span>

                          </div>

                        </td>

                        {/* LOCATION */}

                        <td>

                          <div className="location-cell">

                            <span className="location-icon">
                              📍
                            </span>

                            <span>
                              -
                            </span>

                          </div>

                        </td>

                        {/* DOCTOR */}

                        <td>

                          <span className="doctor-name">
                            {doctor}
                          </span>

                        </td>

                        {/* CUSTOMER */}

                        <td>

                          <span className="customer-name">
                            {customer}
                          </span>

                        </td>

                        {/* ADDRESS */}

                        <td className="address-cell">
                          -
                        </td>

                        {/* TYPE */}

                        <td>

                          <span className="type-badge">

                            {item.fileType ===
                            "pdf"
                              ? "PDF"
                              : "Image"}

                          </span>

                        </td>

                        {/* DATE */}

                        <td>

                          <div className="date-cell">

                            <strong>
                              {formatDate(
                                item.createdAt
                              )}
                            </strong>

                            <span>
                              {formatTime(
                                item.createdAt
                              )}
                            </span>

                          </div>

                        </td>

                        {/* IMAGES */}

                        <td>

                          <button
                            className="image-count"
                            onClick={() =>
                              handleView(
                                item
                              )
                            }
                            title="View uploaded prescription"
                          >
                            📷 1
                          </button>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`status-badge ${
                              item.status ||
                              "pending"
                            }`}
                          >
                            {status}
                          </span>

                        </td>

                        {/* ACTION */}

                        <td>

                          <div className="action-buttons">

                            <button
                              className="view-btn"
                              onClick={() =>
                                handleView(
                                  item
                                )
                              }
                            >
                              View
                            </button>

                            <button
                              className="order-btn"
                              onClick={() =>
                                handleOrder(
                                  item._id
                                )
                              }
                            >
                              Order
                            </button>

                          </div>

                        </td>

                      </tr>

                    );
                  }
                )

              ) : (

                <tr>

                  <td
                    colSpan="12"
                    className="empty-state"
                  >

                    <div className="empty-icon">
                      📋
                    </div>

                    <h3>
                      No prescriptions found
                    </h3>

                    <p>
                      Try changing your
                      search or filter.
                    </p>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="prescription-footer">

          <span>

            Showing{" "}

            <strong>
              {filteredData.length}
            </strong>{" "}

            of{" "}

            <strong>
              {prescriptions.length}
            </strong>{" "}

            prescriptions

          </span>

          <div className="pagination">

            <button disabled>
              ‹
            </button>

            <button className="active">
              1
            </button>

            <button disabled>
              ›
            </button>

          </div>

        </div>

      </div>

      {/* =====================================================
          IMAGE MODAL
      ===================================================== */}

      {showImageModal &&
        selectedPrescription && (

          <div
            className="prescription-image-modal-overlay"
            onClick={
              closeImageModal
            }
          >

            <div
              className="prescription-image-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="prescription-image-modal-header">

                <div>

                  <h2>
                    Prescription
                  </h2>

                  <p>
                    {
                      selectedPrescription.patientName
                    }
                  </p>

                </div>

                <button
                  onClick={
                    closeImageModal
                  }
                  className="prescription-modal-close"
                >
                  ×
                </button>

              </div>

              {/* BODY */}

              <div className="prescription-image-modal-body">

                {selectedPrescription.fileType ===
                "pdf" ? (

                  <iframe
                    src={getFileUrl(
                      selectedPrescription.fileUrl
                    )}
                    title="Prescription PDF"
                    className="prescription-pdf"
                  />

                ) : (

                  <img
                    src={getFileUrl(
                      selectedPrescription.fileUrl
                    )}
                    alt={
                      selectedPrescription.fileName ||
                      "Prescription"
                    }
                    className="prescription-full-image"
                  />

                )}

              </div>

              {/* FOOTER */}

              <div className="prescription-image-modal-footer">

                <div>

                  <strong>
                    Patient:
                  </strong>{" "}

                  {
                    selectedPrescription.patientName
                  }

                  <br />

                  <strong>
                    Doctor:
                  </strong>{" "}

                  {
                    selectedPrescription.doctorName ||
                    "-"
                  }

                </div>

                <a
                  href={getFileUrl(
                    selectedPrescription.fileUrl
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="open-prescription-btn"
                >
                  Open Full Size ↗
                </a>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}