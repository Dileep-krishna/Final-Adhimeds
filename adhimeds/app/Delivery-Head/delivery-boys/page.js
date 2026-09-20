"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { getDeliveryBoysAPI } from "@/app/services/deliveryService";
import { getOrdersByStore, updateItemStatus } from "@/app/services/orderAPI";
import { getStoreId } from "@/utils/jwtHelper";
import "./delivery-boys.css"; // custom CSS

export default function DeliveryBoysPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBoy, setSelectedBoy] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [assignedModalOpen, setAssignedModalOpen] = useState(false);
  const [viewingBoy, setViewingBoy] = useState(null);

  let storeId = getStoreId();
  if (!storeId) {
    storeId = localStorage.getItem('storeId') || sessionStorage.getItem('storeId');
  }
  const storeDistrict = 
    localStorage.getItem('district') || 
    sessionStorage.getItem('district') ||
    localStorage.getItem('staffDistrict') || 
    sessionStorage.getItem('staffDistrict') || 
    null;

  const {
    data: boys = [],
    isLoading: boysLoading,
    error,
    refetch: refetchBoys,
  } = useQuery({
    queryKey: ["deliveryBoys"],
    queryFn: async () => {
      const response = await getDeliveryBoysAPI();
      let boysData = [];
      if (Array.isArray(response)) boysData = response;
      else if (response?.data && Array.isArray(response.data)) boysData = response.data;
      else if (response?.body && Array.isArray(response.body)) boysData = response.body;
      else if (response?.result && Array.isArray(response.result)) boysData = response.result;
      else if (response?.success && Array.isArray(response.data)) boysData = response.data;
      else {
        for (const key of Object.keys(response || {})) {
          if (Array.isArray(response[key])) { boysData = response[key]; break; }
        }
      }
      return boysData.map((boy) => ({
        ...boy,
        district: boy.district || boy.zone || '',
      }));
    },
    staleTime: 60000,
    refetchInterval: 30000,
    placeholderData: (prev) => prev,
  });

  const {
    data: orders = [],
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["orders", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const response = await getOrdersByStore(storeId);
      return response.data || [];
    },
    enabled: !!storeId,
    staleTime: 10000,
    refetchInterval: 30000,
    placeholderData: (prev) => prev,
  });

  const filteredBoys = useMemo(() => {
    let result = boys;
    if (storeDistrict) {
      result = boys.filter(
        (b) => b.district?.toLowerCase() === storeDistrict.toLowerCase()
      );
    }
    if (searchTerm.trim()) {
      result = result.filter(
        (b) =>
          b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.phone?.includes(searchTerm) ||
          b.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [boys, storeDistrict, searchTerm]);

  const assignableOrders = useMemo(() => {
    const items = [];
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        if (item.status === "assigned" && !item.assignedTo) {
          items.push({ order, item });
        }
      });
    });
    return items;
  }, [orders]);

  const getAssignedOrdersForBoy = (boyId) => {
    const items = [];
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        if (item.assignedTo === boyId) {
          items.push({ order, item });
        }
      });
    });
    return items;
  };

  const assignMutation = useMutation({
    mutationFn: async ({ boyId, orderIds }) => {
      const results = [];
      for (const { orderId, itemId } of orderIds) {
        try {
          const result = await updateItemStatus(orderId, itemId, "assigned", boyId);
          results.push(result);
        } catch (err) {
          console.error(`Failed to assign item ${itemId}:`, err);
          throw err;
        }
      }
      return results;
    },
    onSuccess: () => {
      toast.success("Orders assigned successfully!");
      setAssignModalOpen(false);
      setSelectedBoy(null);
      setSelectedOrders([]);
      queryClient.invalidateQueries({ queryKey: ["orders", storeId] });
      refetchOrders();
      queryClient.invalidateQueries({ queryKey: ["deliveryBoys"] });
      refetchBoys();
    },
    onError: (error) => {
      console.error("Assign error:", error);
      toast.error("Failed to assign orders");
    },
  });

  const stats = useMemo(() => {
    const total = filteredBoys.length;
    const active = filteredBoys.filter((b) => b.status === "active").length;
    const offline = filteredBoys.filter((b) => b.status === "offline").length;
    const totalDeliveries = filteredBoys.reduce((sum, b) => sum + (b.totalDeliveries || 0), 0);
    const avgRating =
      filteredBoys.reduce((sum, b) => sum + (b.rating || 0), 0) / (total || 1);
    return { total, active, offline, totalDeliveries, avgRating: avgRating.toFixed(1) };
  }, [filteredBoys]);

  const handleAssignClick = (boy) => {
    setSelectedBoy(boy);
    setSelectedOrders([]);
    setAssignModalOpen(true);
  };

  const handleOrderToggle = (orderId, itemId) => {
    setSelectedOrders((prev) =>
      prev.some(o => o.orderId === orderId && o.itemId === itemId)
        ? prev.filter(o => !(o.orderId === orderId && o.itemId === itemId))
        : [...prev, { orderId, itemId }]
    );
  };

  const handleAssignSubmit = () => {
    if (!selectedBoy) return;
    if (selectedOrders.length === 0) {
      toast.error("Please select at least one order");
      return;
    }
    assignMutation.mutate({ boyId: selectedBoy.id || selectedBoy._id, orderIds: selectedOrders });
  };

  const handleViewAssigned = (boy) => {
    setViewingBoy(boy);
    setAssignedModalOpen(true);
  };

  const isLoading = boysLoading || ordersLoading;

  if (!storeDistrict) {
    return (
      <div className="db-page">
        <div className="db-alert db-alert-warning">No store district found. Please log in again.</div>
      </div>
    );
  }

  return (
    <div className="db-page">
      <div className="db-container">
        {/* Header */}
        <div className="db-header">
          <div>
            <h4 className="db-title">👥 Delivery Boys</h4>
            <p className="db-subtitle">Manage your delivery team in <strong>{storeDistrict}</strong></p>
          </div>
          <button className="db-btn db-btn-refresh" onClick={() => refetchBoys()}>
            <i className="bi bi-arrow-clockwise me-2"></i>Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="db-stats-grid">
          <div className="db-stat-card db-stat-total">
            <div>
              <p className="db-stat-label">Total Boys</p>
              <h3 className="db-stat-value">{stats.total}</h3>
            </div>
            <div className="db-stat-icon">
              <i className="bi bi-people"></i>
            </div>
          </div>
          <div className="db-stat-card db-stat-active">
            <div>
              <p className="db-stat-label">Active</p>
              <h3 className="db-stat-value">{stats.active}</h3>
            </div>
            <div className="db-stat-icon">
              <i className="bi bi-check-circle"></i>
            </div>
          </div>
          <div className="db-stat-card db-stat-offline">
            <div>
              <p className="db-stat-label">Offline</p>
              <h3 className="db-stat-value">{stats.offline}</h3>
            </div>
            <div className="db-stat-icon">
              <i className="bi bi-circle"></i>
            </div>
          </div>
          <div className="db-stat-card db-stat-deliveries">
            <div>
              <p className="db-stat-label">Total Deliveries</p>
              <h3 className="db-stat-value">{stats.totalDeliveries}</h3>
            </div>
            <div className="db-stat-icon">
              <i className="bi bi-truck"></i>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="db-search-section">
          <div className="db-search-wrapper">
            <span className="db-search-icon">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="db-search-input"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="db-filter-badge">
            {filteredBoys.length} of {boys.length} boys in {storeDistrict}
          </span>
        </div>

        {/* Boys Grid */}
        {isLoading && !boys.length ? (
          <div className="db-loading">
            <div className="spinner-border text-primary" />
          </div>
        ) : error ? (
          <div className="db-alert db-alert-danger">Failed to load delivery boys</div>
        ) : filteredBoys.length === 0 ? (
          <div className="db-empty-state">
            <i className="bi bi-person-x fs-1"></i>
            <p className="mt-2">No delivery boys found in <strong>{storeDistrict}</strong></p>
            <p className="small">Please add delivery boys in this district.</p>
          </div>
        ) : (
          <div className="db-boys-grid">
            {filteredBoys.map((boy) => {
              const assignedOrders = getAssignedOrdersForBoy(boy.id || boy._id);
              return (
                <div key={boy.id || boy._id} className="db-boy-card">
                  <div className="db-boy-header">
                    <div className="db-boy-avatar">
                      {boy.avatar ? (
                        <img
                          src={boy.avatar}
                          alt={boy.name}
                          className="db-avatar-img"
                          onError={(e) => (e.target.style.display = "none")}
                        />
                      ) : (
                        <div className="db-avatar-placeholder">
                          <i className="bi bi-person fs-2"></i>
                        </div>
                      )}
                      <span className={`db-status-dot ${boy.status === "active" ? "db-status-active" : "db-status-offline"}`}></span>
                    </div>
                    <div className="db-boy-info">
                      <h6 className="db-boy-name">{boy.name}</h6>
                      <p className="db-boy-phone"><i className="bi bi-phone me-1"></i>{boy.phone}</p>
                      <p className="db-boy-email"><i className="bi bi-envelope me-1"></i>{boy.email || "N/A"}</p>
                      <span className="db-boy-district">{boy.district}</span>
                    </div>
                    <span className={`db-boy-status ${boy.status === "active" ? "db-boy-status-active" : "db-boy-status-offline"}`}>
                      {boy.status || "offline"}
                    </span>
                  </div>

                  <div className="db-boy-stats">
                    <div>
                      <small>Deliveries</small>
                      <p className="db-stat-number">{boy.totalDeliveries || 0}</p>
                    </div>
                    <div>
                      <small>Rating</small>
                      <p className="db-stat-number"><i className="bi bi-star-fill text-warning me-1"></i>{boy.rating || 0}</p>
                    </div>
                    <div>
                      <small>Joined</small>
                      <p className="db-stat-number small">
                        {boy.joinedDate ? new Date(boy.joinedDate).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div>
                      <small>Assigned</small>
                      <p className="db-stat-number small">{assignedOrders.length}</p>
                    </div>
                  </div>

                  <button className="db-btn db-btn-primary db-btn-block" onClick={() => handleAssignClick(boy)}>
                    <i className="bi bi-check2-square me-2"></i>Assign Orders
                  </button>
                  <button className="db-btn db-btn-outline db-btn-block" onClick={() => handleViewAssigned(boy)} disabled={assignedOrders.length === 0}>
                    <i className="bi bi-eye me-2"></i>View Assigned ({assignedOrders.length})
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {assignModalOpen && selectedBoy && (
        <div className="db-modal-overlay" onClick={() => setAssignModalOpen(false)}>
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-content">
              <div className="db-modal-header">
                <h5 className="db-modal-title">Assign Orders to {selectedBoy.name}</h5>
                <button className="db-modal-close" onClick={() => setAssignModalOpen(false)}>&times;</button>
              </div>
              <div className="db-modal-body">
                <p className="db-modal-text">Select orders to assign to this delivery boy:</p>
                {assignableOrders.length === 0 ? (
                  <p className="db-modal-empty">No orders ready for assignment</p>
                ) : (
                  <div className="db-order-list">
                    {assignableOrders.map(({ order, item }) => {
                      const isChecked = selectedOrders.some(
                        o => o.orderId === order._id && o.itemId === item._id
                      );
                      return (
                        <label key={`${order._id}-${item._id}`} className={`db-order-item ${isChecked ? "db-order-item-active" : ""}`}>
                          <input
                            type="checkbox"
                            className="db-checkbox"
                            checked={isChecked}
                            onChange={() => handleOrderToggle(order._id, item._id)}
                          />
                          <div className="db-order-info">
                            <strong>#{order._id.slice(-8)}</strong> – {item.productName}
                            <br />
                            <small>{item.storeName} · Qty: {item.quantity} · ₹{(item.mrp || 0) * item.quantity}</small>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="db-modal-footer">
                <button className="db-btn db-btn-secondary" onClick={() => setAssignModalOpen(false)}>Cancel</button>
                <button className="db-btn db-btn-primary" onClick={handleAssignSubmit} disabled={assignMutation.isPending || selectedOrders.length === 0}>
                  {assignMutation.isPending ? "Assigning..." : `Assign ${selectedOrders.length} Order(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Assigned Modal */}
      {assignedModalOpen && viewingBoy && (
        <div className="db-modal-overlay" onClick={() => setAssignedModalOpen(false)}>
          <div className="db-modal db-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-content">
              <div className="db-modal-header">
                <h5 className="db-modal-title">Orders assigned to {viewingBoy.name}</h5>
                <button className="db-modal-close" onClick={() => setAssignedModalOpen(false)}>&times;</button>
              </div>
              <div className="db-modal-body">
                {(() => {
                  const assignedItems = getAssignedOrdersForBoy(viewingBoy.id || viewingBoy._id);
                  if (assignedItems.length === 0) {
                    return <p className="db-modal-empty">No orders assigned</p>;
                  }
                  return (
                    <div className="db-table-wrapper">
                      <table className="db-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Product</th>
                            <th>Store</th>
                            <th>Qty</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignedItems.map(({ order, item }) => (
                            <tr key={`${order._id}-${item._id}`}>
                              <td>#{order._id.slice(-8)}</td>
                              <td>{item.productName}</td>
                              <td>{item.storeName}</td>
                              <td>{item.quantity}</td>
                              <td>₹{(item.mrp || 0) * item.quantity}</td>
                              <td><span className="db-badge db-badge-info">{item.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
              <div className="db-modal-footer">
                <button className="db-btn db-btn-secondary" onClick={() => setAssignedModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}