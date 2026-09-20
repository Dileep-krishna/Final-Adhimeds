"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrdersByStore, deleteItem } from "../../services/orderAPI";
import { getStoreId } from "@/utils/jwtHelper";
import { toast } from "sonner";
import { FaEye, FaDownload, FaTrashAlt } from "react-icons/fa";
import "./all-orders.css";

export default function AllOrdersPage() {
  const router = useRouter();
  const storeId = getStoreId();
  const queryClient = useQueryClient();

  // ── Filter states ──
  const [bulkAction, setBulkAction] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrders, setSelectedOrders] = useState([]);

  console.log("🔍 AllOrdersPage: storeId =", storeId);

  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["orders", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      console.log("🔄 Fetching orders for storeId:", storeId);
      const response = await getOrdersByStore(storeId);
      console.log("📦 Raw API response:", response);
      if (!response.success) throw new Error("Failed to load orders");
      const filtered = response.data.filter(order => order.items && order.items.length > 0);
      console.log("📦 Orders after filtering (non-empty):", filtered);
      return filtered;
    },
    enabled: !!storeId,
    refetchInterval: 30000,
    staleTime: 10000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    refetch();
  }, []);

  // ── Delete Order ──
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId) => {
      const order = orders.find(o => o._id === orderId);
      if (!order) throw new Error("Order not found");
      for (const item of order.items) {
        await deleteItem(orderId, item._id);
      }
    },
    onSuccess: async (data, orderId) => {
      toast.success(`Order ${orderId} deleted.`);
      await queryClient.invalidateQueries({ queryKey: ["orders", storeId] });
      await refetch();
    },
    onError: (error, orderId) => {
      toast.error(`Failed to delete order ${orderId}.`);
      refetch();
    },
  });

  // ── Bulk Delete ──
  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      for (const orderId of selectedOrders) {
        const order = orders.find(o => o._id === orderId);
        if (!order) continue;
        for (const item of order.items) {
          await deleteItem(orderId, item._id);
        }
      }
    },
    onSuccess: async () => {
      toast.success(`${selectedOrders.length} orders deleted.`);
      setSelectedOrders([]);
      await queryClient.invalidateQueries({ queryKey: ["orders", storeId] });
      await refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete selected orders.");
    },
  });

  const handleDeleteOrder = (orderId) => {
    if (!confirm(`Delete entire order ${orderId}?`)) return;
    deleteOrderMutation.mutate(orderId);
  };

  const handleBulkAction = () => {
    if (!selectedOrders.length) {
      toast.error("Select at least one order.");
      return;
    }
    if (bulkAction === "delete") {
      if (!confirm(`Delete ${selectedOrders.length} selected orders?`)) return;
      bulkDeleteMutation.mutate();
    } else {
      toast.info("Bulk action: " + bulkAction);
    }
  };

  // ── Select all toggle ──
  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o._id));
    }
  };

  const toggleSelectOrder = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // ── Format date ──
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // ── Format order code (YYYYMMDD-HHMMSSss) ──
  const formatOrderCode = (order) => {
    const date = new Date(order.createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0').slice(0, 2);
    return `${year}${month}${day}-${hours}${minutes}${seconds}${ms}`;
  };

  // ── Status badge map ──
  const getStatusBadge = (status) => {
    const map = {
      pending: "bg-warning text-dark",
      confirmed: "bg-info text-white",
      processing: "bg-primary text-white",
      completed: "bg-success text-white",
      cancelled: "bg-danger text-white",
      assigned: "bg-secondary text-white",
    };
    return map[status] || "bg-secondary text-white";
  };

  // ── Apply filters ──
  const filteredOrders = orders.filter(order => {
    const statuses = order.items.map(item => item.status);
    let orderStatus = "pending";
    if (statuses.includes("cancelled")) orderStatus = "cancelled";
    else if (statuses.includes("assigned")) orderStatus = "assigned";
    else if (statuses.includes("confirmed")) orderStatus = "confirmed";
    else if (statuses.includes("processing")) orderStatus = "processing";

    if (deliveryFilter && orderStatus !== deliveryFilter) return false;
    if (paymentFilter && paymentFilter !== "Un-Paid") return false;
    if (dateFilter) {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      if (orderDate !== dateFilter) return false;
    }
    const formattedCode = formatOrderCode(order);
    if (searchTerm && !formattedCode.includes(searchTerm) && !order._id.includes(searchTerm)) return false;
    return true;
  });

  if (!storeId) {
    return <div className="alert alert-warning">No store ID found. Please log in again.</div>;
  }

  return (
    <div className="orders-page-wrapper">
      <div className="container-fluid py-4">
        <div className="orders-card">
          <div className="orders-header">
            <h3>All Orders</h3>
            <div className="row g-3 align-items-center mb-4">
              <div className="col-lg-2 col-md-6">
                <select
                  className="form-select"
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                >
                  <option value="">Bulk Action</option>
                  <option value="delete">Delete</option>
                  <option value="update">Update Status</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-6">
                <select
                  className="form-select"
                  value={deliveryFilter}
                  onChange={(e) => setDeliveryFilter(e.target.value)}
                >
                  <option value="">Filter by Delivery Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="assigned">Assigned</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-6">
                <select
                  className="form-select"
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                >
                  <option value="">Filter by Payment Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Un-Paid">Un-Paid</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-6">
                <input
                  type="date"
                  className="form-control"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div className="col-lg-2 col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type Order code & hit Enter"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-lg-1 col-md-6">
                <button className="btn btn-primary w-100" onClick={() => refetch()}>
                  Filter
                </button>
              </div>
              {selectedOrders.length > 0 && (
                <div className="col-lg-1 col-md-6">
                  <button className="btn btn-danger w-100" onClick={handleBulkAction}>
                    Apply Bulk
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="table-responsive">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-5">
                <h5 className="fw-bold empty-title">No Orders Found</h5>
                <p className="empty-subtitle">You have no orders yet.</p>
              </div>
            ) : (
              <table className="table align-middle orders-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === orders.length && orders.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Order Code</th>
                    <th>No. Products</th>
                    <th>Customer</th>
                    <th>Seller</th>
                    <th>Amount</th>
                    <th>Delivery Status</th>
                    <th>Payment Method</th>
                    <th>Payment Status</th>
                    <th className="text-center">Options</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const statuses = order.items.map(item => item.status);
                    let displayStatus = "pending";
                    if (statuses.includes("cancelled")) displayStatus = "cancelled";
                    else if (statuses.includes("assigned")) displayStatus = "assigned";
                    else if (statuses.includes("confirmed")) displayStatus = "confirmed";
                    else if (statuses.includes("processing")) displayStatus = "processing";

                    return (
                      <tr key={order._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order._id)}
                            onChange={() => toggleSelectOrder(order._id)}
                          />
                        </td>
                        <td>
                          {/* ✅ Removed fw-semibold – now normal weight */}
                          <div className="order-code">{formatOrderCode(order)}</div>
                          <span className="order-date">{formatDate(order.createdAt)}</span>
                        </td>
                        <td className="product-count">{order.items?.length || 0}</td>
                        <td className="order-customer">Guest</td>
                        <td className="order-seller">{order.items?.[0]?.storeName || "Inhouse Order"}</td>
                        <td className="order-amount">₹{(order.total || 0).toFixed(2)}</td>
                        <td>
                          <span className={`badge rounded-pill px-3 py-2 ${getStatusBadge(displayStatus)}`}>
                            {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                          </span>
                        </td>
                        <td className="payment-method">Cash on Delivery</td>
                        <td>
                          <span className="status-badge">Un-Paid</span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn view"
                              onClick={() => router.push(`/All-store-management/Order-Details?id=${order._id}`)}
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            <button
                              className="action-btn download"
                              onClick={() => toast.info("Download invoice for order " + order._id)}
                              title="Download Invoice"
                            >
                              <FaDownload />
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => handleDeleteOrder(order._id)}
                              disabled={deleteOrderMutation.isPending}
                              title="Delete Order"
                            >
                              <FaTrashAlt />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}