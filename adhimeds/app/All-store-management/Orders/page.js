"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllOrders, updateItemStatus, deleteItem } from "../../services/orderAPI";
import { toast } from "sonner";
import { useOrderNotifications } from "@/context/OrderNotificationContext";
import "./orders.css";

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { refreshNotificationsWithSound, stopRinging } = useOrderNotifications();

  // Read active tab from URL, default to "Requests"
  let activeStatus = searchParams.get("tab") || "Requests";

  // ✅ If "All" is somehow passed, redirect to the dedicated All-Orders page
  useEffect(() => {
    if (activeStatus === "All") {
      router.replace("/All-store-management/All-Orders");
    }
  }, [activeStatus, router]);

  // ---------- Fetch orders with real-time updates ----------
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

  // ---------- Mutations with immediate UI updates ----------
  const acceptMutation = useMutation({
    mutationFn: ({ orderId, itemId }) => updateItemStatus(orderId, itemId, "processing"),
    onSuccess: async (data, variables) => {
      toast.success("Product accepted!");
      stopRinging();

      queryClient.setQueryData(["orders"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(order => {
          if (order._id === variables.orderId) {
            return {
              ...order,
              items: order.items.map(item => {
                if (item._id === variables.itemId) {
                  return { ...item, status: "processing" };
                }
                return item;
              })
            };
          }
          return order;
        });
      });

      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await refetch();
      refreshNotificationsWithSound();
    },
    onError: () => toast.error("Failed to accept product"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ orderId, itemId }) => updateItemStatus(orderId, itemId, "cancelled"),
    onSuccess: async (data, variables) => {
      toast.success("Product rejected!");
      stopRinging();

      queryClient.setQueryData(["orders"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(order => {
          if (order._id === variables.orderId) {
            return {
              ...order,
              items: order.items.map(item => {
                if (item._id === variables.itemId) {
                  return { ...item, status: "cancelled" };
                }
                return item;
              })
            };
          }
          return order;
        });
      });

      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await refetch();
      refreshNotificationsWithSound();
    },
    onError: () => toast.error("Failed to reject product"),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ orderId, itemId }) => deleteItem(orderId, itemId),
    onSuccess: async (data, variables) => {
      toast.success(`"${variables.productName}" deleted!`);
      stopRinging();

      queryClient.setQueryData(["orders"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(order => {
          if (order._id === variables.orderId) {
            return {
              ...order,
              items: order.items.filter(item => item._id !== variables.itemId)
            };
          }
          return order;
        }).filter(order => order.items.length > 0);
      });

      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await refetch();
      refreshNotificationsWithSound();
    },
    onError: () => toast.error("Failed to delete item"),
  });

  // ---------- Handlers ----------
  const handleAccept = (orderId, itemId) => {
    if (!confirm("Accept this product?")) return;
    acceptMutation.mutate({ orderId, itemId });
  };

  const handleReject = (orderId, itemId) => {
    if (!confirm("Reject this product?")) return;
    rejectMutation.mutate({ orderId, itemId });
  };

  const handleDeleteItem = (orderId, itemId, productName) => {
    if (!confirm(`Delete "${productName}" from this order?`)) return;
    deleteMutation.mutate({ orderId, itemId, productName });
  };

  // ---------- UI Helpers ----------
  // ✅ "All" is REMOVED from statusMap – only specific filters remain
  const statusMap = {
    "Requests": "pending",
    "Accepted Requests": "processing",
    "Prepayment Requests": "pending",
    "Confirmed Prepayments": "processing",
    "Final Preorders": "completed",
    "In Shipping": "processing",
    "Delivered": "completed",
    "Refund": "cancelled",
  };

  // ✅ Display name for the current tab (capitalized)
  const getTabDisplayName = (tab) => {
    return tab || "Requests";
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: "bg-warning text-dark",
      processing: "bg-info text-white",
      completed: "bg-success text-white",
      cancelled: "bg-danger text-white",
    };
    return map[status] || "bg-secondary";
  };

  // ✅ getCount now only works with mapped statuses – "All" case removed
  const getCount = (label) => {
    let count = 0;
    const mapped = statusMap[label];
    if (!mapped) return 0; // safety fallback

    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        if (item.status === mapped) {
          count++;
        }
      });
    });
    return count;
  };

  // ✅ expandedRows – "All" case completely removed
  const expandedRows = [];
  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const mapped = statusMap[activeStatus];
      if (mapped && item.status === mapped) {
        expandedRows.push({ order, item });
      }
    });
  });

  const isLoadingAction =
    acceptMutation.isPending ||
    rejectMutation.isPending ||
    deleteMutation.isPending;

  // ---------- Render ----------
  return (
    <div className="container-fluid px-4">
      <div className="row mt-4">
        <div className="col-12">
          {/* ✅ Updated header – shows the actual tab name */}
          <h4 className="mb-3">
            {getTabDisplayName(activeStatus)}{" "}
            <span className="text-muted fs-6">({getCount(activeStatus)})</span>
          </h4>

          {/* Orders Table */}
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : expandedRows.length === 0 ? (
            <div className="text-center text-muted py-5">
              <h5>No items found</h5>
              <p>No items match this filter.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Product / Quantity</th>
                    <th>Order Code / Created</th>
                    <th>Price / Prepayment</th>
                    <th>Seller</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Refund</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expandedRows.map(({ order, item }) => {
                    const isPending = item.status === "pending";
                    const key = `${order._id}-${item._id}`;
                    const itemTotal = (item.mrp || 0) * (item.quantity || 1);
                    const prepayment = itemTotal * 0.3;

                    const isThisItemLoading =
                      (acceptMutation.isPending && acceptMutation.variables?.itemId === item._id) ||
                      (rejectMutation.isPending && rejectMutation.variables?.itemId === item._id) ||
                      (deleteMutation.isPending && deleteMutation.variables?.itemId === item._id);

                    return (
                      <tr key={key}>
                        <td>
                          <div className="fw-semibold">{item.productName}</div>
                          <small className="text-muted">QTY: {item.quantity || 1}</small>
                        </td>
                        <td>
                          <div className="fw-semibold">
                            {order._id.substring(order._id.length - 8)}
                          </div>
                          <small className="text-muted">
                            Created: {formatDate(order.createdAt)}
                          </small>
                        </td>
                        <td>
                          <div>${itemTotal.toFixed(2)}</div>
                          <small className="text-muted">
                            / ${prepayment.toFixed(2)} prepayment
                          </small>
                        </td>
                        <td>{item.storeName || order.items?.[0]?.storeName || "N/A"}</td>
                        <td>
                          <div>Guest</div>
                          <small className="text-muted">customer@example.com</small>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(item.status)}`}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-success">Refundable</span>
                        </td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            {isPending ? (
                              <>
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleAccept(order._id, item._id)}
                                  disabled={isThisItemLoading || isLoadingAction}
                                >
                                  {isThisItemLoading && acceptMutation.isPending ? (
                                    <span className="spinner-border spinner-border-sm" />
                                  ) : (
                                    "Accept"
                                  )}
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleReject(order._id, item._id)}
                                  disabled={isThisItemLoading || isLoadingAction}
                                >
                                  {isThisItemLoading && rejectMutation.isPending ? (
                                    <span className="spinner-border spinner-border-sm" />
                                  ) : (
                                    "Reject"
                                  )}
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => router.push(`/pharma-dashboard/orders/${order._id}`)}
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteItem(order._id, item._id, item.productName)}
                                  disabled={isThisItemLoading || isLoadingAction}
                                >
                                  {isThisItemLoading && deleteMutation.isPending ? (
                                    <span className="spinner-border spinner-border-sm" />
                                  ) : (
                                    <i className="bi bi-trash"></i>
                                  )}
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => toast.info("Download invoice for order " + order._id)}
                                >
                                  <i className="bi bi-download"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}