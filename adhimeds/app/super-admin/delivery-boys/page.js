"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import "./delivery-boys.css";
import {
  getDeliveryBoysAPI,
  deleteDeliveryBoyAPI,
  updateDeliveryBoyAPI,
} from "../../services/deliveryService";

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [openMenu, setOpenMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // ── Pagination state ──
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ─── Toast helper ──────────────────────────────────────
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  // ─── Fetch delivery boys ──────────────────────────────
  const { data: deliveryBoys = [], isLoading, error } = useQuery({
    queryKey: ["deliveryBoys"],
    queryFn: async () => {
      const result = await getDeliveryBoysAPI();
      let data = [];
      if (Array.isArray(result)) data = result;
      else if (result?.data && Array.isArray(result.data)) data = result.data;
      else if (result?.success && Array.isArray(result?.data)) data = result.data;
      else if (result?.boys && Array.isArray(result.boys)) data = result.boys;
      else data = [];

      return data.map((boy) => ({
        id: boy._id,
        name: boy.name,
        email: boy.email || "",
        phone: boy.phone,
        status: boy.status,
        earning: boy.earning || "$0.00",
        collection: boy.collection || "$0.00",
      }));
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // ─── Delete mutation ──────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDeliveryBoyAPI(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["deliveryBoys"] });
      const previousBoys = queryClient.getQueryData(["deliveryBoys"]);
      queryClient.setQueryData(["deliveryBoys"], (old) =>
        old.filter((boy) => boy.id !== id)
      );
      return { previousBoys };
    },
    onSuccess: () => {
      showToast("Delivery boy deleted successfully", "success");
      setOpenMenu(null);
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(["deliveryBoys"], context.previousBoys);
      showToast(`Delete failed: ${err.message}`, "error");
    },
  });

  // ─── Toggle status (Ban / Unban) ──────────────────────
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => {
      const form = new FormData();
      form.append("status", status);
      return updateDeliveryBoyAPI(id, form);
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["deliveryBoys"] });
      const previousBoys = queryClient.getQueryData(["deliveryBoys"]);
      queryClient.setQueryData(["deliveryBoys"], (old) =>
        old.map((boy) => (boy.id === id ? { ...boy, status } : boy))
      );
      return { previousBoys };
    },
    onSuccess: (_, { status }) => {
      showToast(`Status changed to ${status}`, "success");
      setOpenMenu(null);
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(["deliveryBoys"], context.previousBoys);
      showToast(`Status update failed: ${err.message}`, "error");
    },
  });

  // ─── Handlers ──────────────────────────────────────────
  const handleEdit = (id) => {
    router.push(`/super-admin/delivery-boys/delivery-boysEdit/${id}`);
    setOpenMenu(null);
  };

  const handleBan = (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    toggleStatusMutation.mutate({ id, status: newStatus });
  };

  const handleCollection = (id) => {
    router.push(`/super-admin/delivery-boys/collection/${id}`);
    setOpenMenu(null);
  };

  const handlePayment = (id) => {
    router.push(`/super-admin/delivery-boys/payment/${id}`);
    setOpenMenu(null);
  };

  const handleAdd = () => {
    router.push("/super-admin/delivery-boys/delivery-boysAdd");
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this delivery boy permanently?")) {
      deleteMutation.mutate(id);
    }
  };

  // ─── Filter by search ──────────────────────────────────
  const filteredBoys = useMemo(() => {
    if (!searchTerm.trim()) return deliveryBoys;
    const term = searchTerm.toLowerCase();
    return deliveryBoys.filter(
      (boy) =>
        boy.name.toLowerCase().includes(term) ||
        boy.email.toLowerCase().includes(term)
    );
  }, [deliveryBoys, searchTerm]);

  // ─── Paginate ──────────────────────────────────────────
  const totalFiltered = filteredBoys.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBoys = filteredBoys.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const toggleMenu = (id) => {
    setOpenMenu(openMenu === id ? null : id);
  };

  // Pagination helpers
  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  // Page numbers to display
  const pageNumbers = () => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const startItem = totalFiltered === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(startIndex + itemsPerPage, totalFiltered);

  return (
    <div className="delivery-page">
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <i
            className={`bi ${
              toast.type === "success"
                ? "bi-check-circle-fill"
                : "bi-exclamation-triangle-fill"
            }`}
          ></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <h2>All Delivery Boys</h2>
        <button className="add-btn" onClick={handleAdd}>
          Add New Delivery Boy
        </button>
      </div>

      {/* Card */}
      <div className="delivery-card">
        {/* Card Header */}
        <div className="card-header-area">
          <h5>Delivery Boys</h5>
          <div className="search-box">
            <input
              type="text"
              placeholder="Type email or name & Enter"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="delivery-table-wrapper">
          {isLoading ? (
            <div className="loading-state text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-4 text-danger">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error.message}
            </div>
          ) : (
            <>
              <table className="delivery-table">
                <thead>
                  <tr>
                    <th width="60">#</th>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Earning</th>
                    <th>Collection</th>
                    <th className="text-center">Options</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBoys.map((item, index) => (
                    <tr key={item.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>{item.name}</td>
                      <td>{item.email}</td>
                      <td>{item.phone}</td>
                      <td>{item.earning}</td>
                      <td>{item.collection}</td>
                      <td className="text-center">
                        <div className="dropdown-wrapper">
                          <button
                            className={`option-btn ${
                              openMenu === item.id ? "active" : ""
                            }`}
                            onClick={() => toggleMenu(item.id)}
                          >
                            <i className="bi bi-three-dots-vertical"></i>
                          </button>

                          {openMenu === item.id && (
                            <div className="option-menu">
                              <button
                                className="menu-item"
                                onClick={() => handleEdit(item.id)}
                              >
                                <i className="bi bi-pencil-square"></i>
                                Edit
                              </button>
                              <button
                                className="menu-item"
                                onClick={() =>
                                  handleBan(item.id, item.status || "active")
                                }
                              >
                                <i className="bi bi-person-x"></i>
                                {item.status === "active"
                                  ? "Ban this delivery boy"
                                  : "Unban"}
                              </button>
                              {/* ─── DELETE ─── */}
                              <button
                                className="menu-item delete"
                                onClick={() => handleDelete(item.id)}
                              >
                                <i className="bi bi-trash"></i>
                                Delete
                              </button>
                              <button
                                className="menu-item"
                                onClick={() => handleCollection(item.id)}
                              >
                                <i className="bi bi-wallet2"></i>
                                Go to Collection
                              </button>
                              <button
                                className="menu-item"
                                onClick={() => handlePayment(item.id)}
                              >
                                <i className="bi bi-cash-stack"></i>
                                Go to Payment
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBoys.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        <i className="bi bi-emoji-frown me-2"></i>
                        No delivery boys found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* ─── Pagination ─── */}
              {totalFiltered > 0 && (
                <div className="pagination-wrapper">
                  <div className="pagination-info">
                    Showing {startItem} to {endItem} of {totalFiltered} boys
                  </div>
                  <div className="pagination-controls">
                    <select
                      className="pagination-select"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n} per page
                        </option>
                      ))}
                    </select>
                    <nav>
                      <ul className="pagination-list">
                        <li className={currentPage === 1 ? "hidden" : ""}>
                          <button
                            onClick={prevPage}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                          >
                            ◀
                          </button>
                        </li>
                        {pageNumbers().map((p) => (
                          <li key={p}>
                            <button
                              onClick={() => goToPage(p)}
                              className={`pagination-btn ${
                                currentPage === p ? "active" : ""
                              }`}
                            >
                              {p}
                            </button>
                          </li>
                        ))}
                        <li className={currentPage === totalPages ? "hidden" : ""}>
                          <button
                            onClick={nextPage}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                          >
                            ▶
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}