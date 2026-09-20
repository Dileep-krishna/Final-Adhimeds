"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getOrdersByStore, updateItemStatus } from "@/app/services/orderAPI";
import { getDeliveryBoysAPI } from "@/app/services/deliveryService";
import { getStoreId } from "@/utils/jwtHelper";
import "./assign-delivery-boys.css";

export default function DeliveryHeadAllOrdersPage() {
  const queryClient = useQueryClient();

  let storeId = getStoreId();
  if (!storeId) {
    storeId = localStorage.getItem('storeId') || sessionStorage.getItem('storeId');
  }
  console.log(`🏪 Assign page store ID: ${storeId}`);

  const storeDistrict = 
    localStorage.getItem('district') || 
    sessionStorage.getItem('district') ||
    localStorage.getItem('staffDistrict') || 
    sessionStorage.getItem('staffDistrict') || 
    null;
  console.log(`📍 Store district: ${storeDistrict}`);

  const { data: orders = [], isLoading: ordersLoading, refetch } = useQuery({
    queryKey: ["orders", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const res = await getOrdersByStore(storeId);
      if (!res.success) throw new Error("Failed to load orders");
      return res.data || [];
    },
    enabled: !!storeId,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const { data: deliveryBoys = [], isLoading: boysLoading } = useQuery({
    queryKey: ["deliveryBoys"],
    queryFn: async () => {
      const response = await getDeliveryBoysAPI();
      let boys = [];
      if (Array.isArray(response)) boys = response;
      else if (response?.data && Array.isArray(response.data)) boys = response.data;
      return boys;
    },
    staleTime: 60000,
    placeholderData: (prev) => prev,
  });

  const [selectedBoyMap, setSelectedBoyMap] = useState({});

  const assignMutation = useMutation({
    mutationFn: async ({ orderId, itemId, boyId }) => {
      const boyIdString = String(boyId);
      const result = await updateItemStatus(orderId, itemId, "assigned", boyIdString);
      return result;
    },
    onSuccess: (data, variables) => {
      const boy = deliveryBoys.find(b => (b.id || b._id) === variables.boyId);
      toast.success(`Order assigned to ${boy?.name || 'boy'}`);
      queryClient.invalidateQueries({ queryKey: ["orders", storeId] });
      refetch();
      setSelectedBoyMap(prev => ({ ...prev, [variables.itemId]: "" }));
    },
    onError: (error) => {
      console.error("Assign error:", error);
      toast.error("Failed to assign order");
    },
  });

  const handleAssign = (orderId, itemId, boyId) => {
    if (!boyId) return toast.error("Select a boy");
    if (!confirm("Assign this order?")) return;
    assignMutation.mutate({ orderId, itemId, boyId: String(boyId) });
  };

  const assignableItems = [];
  orders.forEach(order => {
    (order.items || []).forEach(item => {
      if (item.status === "processing") {
        assignableItems.push({ order, item });
      }
    });
  });

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  });

  const isLoading = ordersLoading || boysLoading;

  const filteredBoys = storeDistrict 
    ? deliveryBoys.filter(boy => boy.district?.toLowerCase() === storeDistrict.toLowerCase())
    : deliveryBoys;

  if (!storeId) {
    return <div className="assign-alert">No store ID found. Please log in again.</div>;
  }

  return (
    <div className="assign-page-wrapper">
      <div className="assign-container">
        <div className="assign-header">
          <h4>Assign Delivery Boys <span className="assign-count">({assignableItems.length})</span></h4>
        </div>

        {isLoading ? (
          <div className="assign-loading"><div className="spinner-border" /></div>
        ) : assignableItems.length === 0 ? (
          <div className="assign-empty">
            <h5>No orders ready for assignment</h5>
            <p>All processing orders have been assigned.</p>
          </div>
        ) : (
          <div className="assign-table-wrapper">
            <table className="assign-table">
              <thead>
                <tr>
                  <th>Product / Qty</th>
                  <th>Order Code / Created</th>
                  <th>Store / District</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Assign to Boy</th>
                </tr>
              </thead>
              <tbody>
                {assignableItems.map(({ order, item }) => {
                  const selectedBoyId = selectedBoyMap[item._id] || "";
                  const isMutating = assignMutation.isPending && assignMutation.variables?.itemId === item._id;
                  const displayBoys = filteredBoys;

                  return (
                    <tr key={`${order._id}-${item._id}`}>
                      <td>
                        <div className="assign-product-name">{item.productName}</div>
                        <small className="assign-muted">QTY: {item.quantity}</small>
                      </td>
                      <td>
                        <div className="assign-order-code">#{order._id.slice(-8)}</div>
                        <small className="assign-muted">Created: {formatDate(order.createdAt)}</small>
                      </td>
                      <td>
                        <div className="assign-store-name">{item.storeName || "N/A"}</div>
                        <small className="assign-muted"><i className="bi bi-geo-alt me-1"></i>{storeDistrict || "All"}</small>
                      </td>
                      <td className="assign-customer">Guest</td>
                      <td><span className="assign-status-badge assign-status-processing">Processing</span></td>
                      <td>
                        <div className="assign-action-group">
                          <select
                            className="assign-select"
                            value={selectedBoyId}
                            onChange={(e) =>
                              setSelectedBoyMap(prev => ({
                                ...prev,
                                [item._id]: e.target.value,
                              }))
                            }
                            disabled={isMutating}
                          >
                            <option value="">Select boy</option>
                            {displayBoys.length === 0 ? (
                              <option value="" disabled>
                                {storeDistrict ? `No boys in ${storeDistrict}` : 'No boys available'}
                              </option>
                            ) : (
                              displayBoys.map((boy) => (
                                <option key={boy.id || boy._id} value={boy.id || boy._id}>
                                  {boy.name} ({boy.district || "N/A"})
                                </option>
                              ))
                            )}
                          </select>
                          <button
                            className="assign-btn assign-btn-primary"
                            onClick={() => handleAssign(order._id, item._id, selectedBoyId)}
                            disabled={!selectedBoyId || isMutating || displayBoys.length === 0}
                          >
                            {isMutating ? <span className="spinner-border spinner-border-sm" /> : "Assign"}
                          </button>
                        </div>
                        {displayBoys.length === 0 && storeDistrict && (
                          <small className="assign-error-msg">⚠️ No delivery boys in {storeDistrict} district</small>
                        )}
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
  );
}