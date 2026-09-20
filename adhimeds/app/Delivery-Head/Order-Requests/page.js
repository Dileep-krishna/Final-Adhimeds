"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOrderNotifications } from "@/context/OrderNotificationContext";
import { getOrdersByStore, updateItemStatus, updateOrderStatus } from "@/app/services/orderAPI";
import "./delivery-order-requests.css"; // 👈 custom CSS

export default function DeliveryHeadOrderRequestsPage() {
  const queryClient = useQueryClient();
  const { refreshNotificationsWithSound, stopRinging } = useOrderNotifications();

  const storeId = localStorage.getItem('storeId') || sessionStorage.getItem('storeId');
  console.log(`🏪 Delivery head store ID: ${storeId}`);

  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["orders", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const response = await getOrdersByStore(storeId);
      if (!response.success) throw new Error("Failed to load orders");
      console.log("📦 Orders fetched for store:", response.data);
      return response.data;
    },
    enabled: !!storeId,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const acceptMutation = useMutation({
    mutationFn: async ({ orderId, itemId }) => {
      console.log(`📤 Accepting order ${orderId}, item ${itemId} → processing`);
      await updateItemStatus(orderId, itemId, "processing");
      await updateOrderStatus(orderId, "processing");
    },
    onSuccess: async () => {
      toast.success("Order accepted for delivery processing!");
      stopRinging();
      await queryClient.invalidateQueries({ queryKey: ["orders", storeId] });
      await refetch();
      refreshNotificationsWithSound();
    },
    onError: (error) => {
      console.error("❌ Accept error:", error);
      toast.error("Failed to accept order");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ orderId, itemId }) => {
      await updateItemStatus(orderId, itemId, "cancelled");
      await updateOrderStatus(orderId, "cancelled");
    },
    onSuccess: async () => {
      toast.success("Order cancelled!");
      stopRinging();
      await queryClient.invalidateQueries({ queryKey: ["orders", storeId] });
      await refetch();
      refreshNotificationsWithSound();
    },
    onError: (error) => {
      console.error("❌ Reject error:", error);
      toast.error("Failed to cancel order");
    },
  });

  const handleAccept = (orderId, itemId) => {
    if (!confirm("Accept this order for delivery processing?")) return;
    acceptMutation.mutate({ orderId, itemId });
  };

  const handleReject = (orderId, itemId) => {
    if (!confirm("Cancel this order?")) return;
    rejectMutation.mutate({ orderId, itemId });
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  });

  const confirmedItems = [];
  orders.forEach(order => {
    (order.items || []).forEach(item => {
      if (item.status === "confirmed") {
        confirmedItems.push({ order, item });
      }
    });
  });

  const isLoadingAction = acceptMutation.isPending || rejectMutation.isPending;

  if (!storeId) return <div className="alert alert-warning">No store ID found.</div>;

  return (
    <div className="order-requests-container">
      <div className="order-requests-header">
        <h4>Delivery Orders <span className="order-requests-count">({confirmedItems.length})</span></h4>
      </div>

      {isLoading ? (
        <div className="order-requests-loading">
          <div className="spinner-border text-primary" />
        </div>
      ) : confirmedItems.length === 0 ? (
        <div className="order-requests-empty">
          <h5>No orders ready for delivery</h5>
        </div>
      ) : (
        <div className="order-requests-table-wrapper">
          <table className="order-requests-table">
            <thead>
              <tr>
                <th>Product / Qty</th>
                <th>Order Code / Created</th>
                <th>Price / Prepayment</th>
                <th>Store</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {confirmedItems.map(({ order, item }) => {
                const itemTotal = (item.mrp || 0) * (item.quantity || 1);
                const prepayment = itemTotal * 0.3;
                const isPending = acceptMutation.isPending && acceptMutation.variables?.itemId === item._id;
                return (
                  <tr key={`${order._id}-${item._id}`}>
                    <td>
                      <div className="order-product-name">{item.productName}</div>
                      <small className="order-product-qty">QTY: {item.quantity || 1}</small>
                    </td>
                    <td>
                      <div className="order-code">#{order._id.slice(-8)}</div>
                      <small className="order-date">Created: {formatDate(order.createdAt)}</small>
                    </td>
                    <td>
                      <div className="order-price">${itemTotal.toFixed(2)}</div>
                      <small className="order-prepayment">/ ${prepayment.toFixed(2)} prepayment</small>
                    </td>
                    <td className="order-store">{item.storeName || "N/A"}</td>
                    <td className="order-customer">Guest</td>
                    <td><span className="order-status-badge order-status-confirmed">Confirmed</span></td>
                    <td>
                      <button
                        className="order-btn order-btn-accept"
                        onClick={() => handleAccept(order._id, item._id)}
                        disabled={isPending || rejectMutation.isPending}
                      >
                        {isPending ? <span className="spinner-border spinner-border-sm" /> : "Accept"}
                      </button>
                      <button
                        className="order-btn order-btn-reject"
                        onClick={() => handleReject(order._id, item._id)}
                        disabled={isPending || rejectMutation.isPending}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}