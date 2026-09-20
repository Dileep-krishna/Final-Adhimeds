"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrderById, updateItemStatus, deleteItem, uploadBill, updateOrderStatus } from "../../services/orderAPI";
import { getStoreId } from "@/utils/jwtHelper";
import SERVERURL from "@/app/services/serverURL";
import "./order-details.css";

export default function OrderDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const queryClient = useQueryClient();

  const [showBillModal, setShowBillModal] = useState(false);
  const [billFile, setBillFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showBillView, setShowBillView] = useState(false);

  // ---------- Fetch order ----------
  const {
    data: order,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const response = await getOrderById(orderId);
      console.log("📦 Order data from API:", response);
      if (!response.success) throw new Error("Failed to load order");
      console.log("📦 Order items:", response.data.items);
      return response.data;
    },
    enabled: !!orderId,
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchInterval: 30000,
  });

  // ---------- Order‑level Accept ----------
  const acceptOrderMutation = useMutation({
    mutationFn: async ({ billUrl }) => {
      if (!order) throw new Error("Order not found");
      const pendingItems = order.items.filter(item => item.status === "pending");
      if (pendingItems.length === 0) {
        throw new Error("No pending items to accept.");
      }
      const promises = pendingItems.map(item =>
        updateItemStatus(orderId, item._id, "confirmed", undefined, billUrl)
      );
      await Promise.all(promises);
      const statusResponse = await updateOrderStatus(orderId, "confirmed");
      return statusResponse.data || statusResponse;
    },
    onSuccess: async (updatedOrder) => {
      toast.success("Order accepted and confirmed!");
      if (updatedOrder) {
        queryClient.setQueryData(["order", orderId], updatedOrder);
      }
      await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      await refetch();
      setShowBillModal(false);
      setBillFile(null);
    },
    onError: (error) => {
      console.error("Accept error:", error);
      toast.error(error.message || "Failed to accept order");
    },
  });

  // ---------- Order‑level Reject ----------
  const rejectOrderMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("Order not found");
      const pendingItems = order.items.filter(item => item.status === "pending");
      if (pendingItems.length === 0) {
        throw new Error("No pending items to reject.");
      }
      const promises = pendingItems.map(item =>
        updateItemStatus(orderId, item._id, "cancelled")
      );
      await Promise.all(promises);
      const statusResponse = await updateOrderStatus(orderId, "cancelled");
      return statusResponse.data || statusResponse;
    },
    onSuccess: async (updatedOrder) => {
      toast.success("All pending items rejected!");
      if (updatedOrder) {
        queryClient.setQueryData(["order", orderId], updatedOrder);
      }
      await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      await refetch();
    },
    onError: (error) => toast.error(error.message || "Failed to reject order"),
  });

  // ---------- Handlers ----------
  const handleAcceptClick = () => setShowBillModal(true);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, JPEG, and PNG files are allowed.');
        setBillFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB.');
        setBillFile(null);
        return;
      }
      setBillFile(file);
    }
  };

  const handleUploadAndAccept = async () => {
    if (!billFile) {
      toast.error('Please select a bill file.');
      return;
    }
    if (!order) {
      toast.error('Order not found.');
      return;
    }

    setUploading(true);
    try {
      const pendingItems = order.items.filter(item => item.status === "pending");
      if (pendingItems.length === 0) {
        toast.error('No pending items to accept.');
        setUploading(false);
        return;
      }
      const firstPendingItemId = pendingItems[0]._id;

      const uploadResult = await uploadBill(orderId, firstPendingItemId, billFile);
      if (!uploadResult.success) {
        toast.error('Bill upload failed: ' + (uploadResult.message || 'Unknown error'));
        setUploading(false);
        return;
      }
      const billUrl = uploadResult.billUrl;
      acceptOrderMutation.mutate({ billUrl });
    } catch (err) {
      toast.error('Error uploading bill.');
    } finally {
      setUploading(false);
    }
  };

  // ---------- UI helpers ----------
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
      confirmed: "bg-info text-white",
      processing: "bg-primary text-white",
      completed: "bg-success text-white",
      cancelled: "bg-danger text-white",
      assigned: "bg-secondary text-white",
    };
    return map[status] || "bg-secondary text-white";
  };

  const getBillPreview = (url) => {
    if (!url) return null;
    const isImage = url.match(/\.(jpeg|jpg|png|gif|webp)$/i);
    const fullUrl = `${SERVERURL}${url}`;
    const encodedUrl = fullUrl.replace(/ /g, '%20');

    if (isImage) {
      return (
        <img
          src={encodedUrl}
          alt="Bill"
          className="order-bill-thumbnail"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      );
    } else {
      return (
        <a href={encodedUrl} target="_blank" rel="noopener noreferrer" className="order-bill-link">
          <i className="bi bi-file-earmark-pdf fs-3 text-danger me-2"></i>
          <span>View PDF Bill</span>
        </a>
      );
    }
  };

  // ---------- Early returns ----------
  if (!orderId) {
    return (
      <div className="order-page">
        <div className="alert alert-danger">Order ID is missing.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="order-page d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-page">
        <div className="alert alert-danger">Order not found.</div>
      </div>
    );
  }

  const orderData = order;
  const customerName = "Guest";
  const customerPhone = "N/A";

  // ─── FIX: Derive order status from items ───
  const statuses = orderData.items.map(item => item.status);
  const hasPending = statuses.includes("pending");
  const hasConfirmed = statuses.includes("confirmed");
  const hasProcessing = statuses.includes("processing");
  const hasCancelled = statuses.includes("cancelled");
  const hasAssigned = statuses.includes("assigned");

  let orderStatus = "pending";
  if (hasCancelled) orderStatus = "cancelled";
  else if (hasAssigned) orderStatus = "assigned";
  else if (hasConfirmed) orderStatus = "confirmed";
  else if (hasProcessing) orderStatus = "processing";

  const totalAmount = orderData.items.reduce(
    (sum, item) => sum + (item.mrp || 0) * (item.quantity || 1),
    0
  );
  const hasPendingItems = orderData.items.some(item => item.status === "pending");
  const billUrl = orderData.items.find(item => item.billUrl)?.billUrl || null;

  // ---------- Main return ----------
  return (
    <div className="order-page">
      <div className="order-container">
        <div className="order-card">
          <div className="order-card-header order-header-gradient">
            <h4 className="order-header-title">
              <i className="bi bi-file-earmark-text me-2"></i>Order Details
            </h4>
            <div className="order-header-actions">
              <button
                className="order-refresh-btn"
                onClick={() => refetch()}
                title="Refresh order status"
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
              <button className="order-back-btn" onClick={() => router.back()}>
                <i className="bi bi-arrow-left me-1"></i> Back
              </button>
            </div>
          </div>

          <div className="order-card-body">
            {/* ─── Top section ─── */}
            <div className="order-top-row">
              <div className="order-left-col">
                <div className="order-customer-info">
                  <div className="order-qr">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${orderData._id}`}
                      width={110}
                      height={110}
                      alt="QR"
                      className="order-qr-img"
                    />
                  </div>
                  <div>
                    <h5 className="order-customer-name">{customerName}</h5>
                    <p className="order-text-muted">{customerPhone}</p>
                  </div>
                </div>

                <div className="order-bill-section">
                  <div className="order-bill-header">
                    <h6 className="order-bill-title">
                      <i className="bi bi-file-earmark-check me-2 order-icon-success"></i>
                      Uploaded Bill
                    </h6>
                    {billUrl && (
                      <button
                        className="order-view-bill-btn"
                        onClick={() => setShowBillView(true)}
                      >
                        <i className="bi bi-eye me-1"></i> View
                      </button>
                    )}
                  </div>
                  {billUrl ? (
                    <div className="order-bill-preview">{getBillPreview(billUrl)}</div>
                  ) : (
                    <div className="order-text-muted small">No bill uploaded yet.</div>
                  )}
                </div>
              </div>

              <div className="order-right-col">
                <div className="order-info-card">
                  <table className="order-info-table">
                    <tbody>
                      <tr><th className="order-info-label">Order #</th><td className="order-info-value order-accent">{orderData._id}</td></tr>
                      <tr><th className="order-info-label">Status</th><td><span className={`order-status-badge ${getStatusBadge(orderStatus)}`}>{orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}</span></td></tr>
                      <tr><th className="order-info-label">Date</th><td className="order-info-value">{formatDate(orderData.createdAt)}</td></tr>
                      <tr><th className="order-info-label">Total</th><td className="order-info-value order-accent fw-bold">₹{totalAmount.toFixed(2)}</td></tr>
                      <tr><th className="order-info-label">Payment</th><td className="order-info-value">Cash on Delivery</td></tr>
                      <tr><th className="order-info-label">Additional</th><td className="order-info-value">—</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <hr className="order-divider" />

            {/* ─── Product table ─── */}
            <div className="order-table-responsive">
              <table className="order-table">
                <thead className="order-table-header">
                  <tr>
                    <th>#</th>
                    <th>Photo</th>
                    <th>Description</th>
                    <th>Delivery Type</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Price</th>
                    <th className="text-end">Total</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orderData.items.map((item, idx) => {
                    const itemTotal = (item.mrp || 0) * (item.quantity || 1);
                    return (
                      <tr key={item._id || idx}>
                        <td>{idx + 1}</td>
                        <td className="text-center" style={{ fontSize: '1.5rem' }}>💊</td>
                        <td>
                          <div className="order-product-name">{item.productName}</div>
                          <small className="order-text-muted">SKU: {item.sku || "-"}</small>
                        </td>
                        <td>{item.deliveryType || "-"}</td>
                        <td className="text-center">{item.quantity || 1}</td>
                        <td className="text-end">₹{(item.mrp || 0).toFixed(2)}</td>
                        <td className="text-end">₹{itemTotal.toFixed(2)}</td>
                        <td className="text-center">
                          <span className={`order-status-badge ${getStatusBadge(item.status)}`}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ─── Summary ─── */}
            <div className="order-summary-row">
              <div className="order-summary-card">
                <table className="order-summary-table">
                  <tbody>
                    <tr><th>Sub Total :</th><td className="text-end">₹{totalAmount.toFixed(2)}</td></tr>
                    <tr><th>Tax :</th><td className="text-end">₹0.00</td></tr>
                    <tr><th>Shipping :</th><td className="text-end">₹0.00</td></tr>
                    <tr><th>Coupon :</th><td className="text-end">₹0.00</td></tr>
                    <tr className="order-summary-total">
                      <th className="fs-5">Total :</th>
                      <th className="text-end fs-3 order-accent">₹{totalAmount.toFixed(2)}</th>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ─── Actions ─── */}
            <div className="order-actions">
              {hasPendingItems && (
                <>
                  <button
                    className="order-btn order-btn-success"
                    onClick={handleAcceptClick}
                    disabled={acceptOrderMutation.isPending}
                  >
                    {acceptOrderMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Accept Order
                      </>
                    )}
                  </button>
                  <button
                    className="order-btn order-btn-danger"
                    onClick={() => {
                      if (!confirm("Reject all pending items?")) return;
                      rejectOrderMutation.mutate();
                    }}
                    disabled={rejectOrderMutation.isPending}
                  >
                    {rejectOrderMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-x-circle me-2"></i>
                        Reject Order
                      </>
                    )}
                  </button>
                </>
              )}
              <button
                className="order-btn order-btn-print"
                onClick={() => window.print()}
              >
                <i className="bi bi-printer fs-4"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bill Upload Modal ─── */}
      {showBillModal && (
        <div
          className="order-modal-overlay"
          onClick={() => {
            setShowBillModal(false);
            setBillFile(null);
          }}
        >
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-content">
              <div className="order-modal-header order-header-gradient">
                <h5 className="order-modal-title"><i className="bi bi-upload me-2"></i>Upload Bill</h5>
                <button
                  className="order-modal-close"
                  onClick={() => {
                    setShowBillModal(false);
                    setBillFile(null);
                  }}
                >
                  &times;
                </button>
              </div>
              <div className="order-modal-body">
                <p className="order-text-muted">Please upload the bill document (PDF or image) to accept the order.</p>
                <div className="order-drop-zone">
                  <i className="bi bi-cloud-upload fs-1 order-accent"></i>
                  <p className="mt-2">Drop your file here or click to browse</p>
                  <input
                    type="file"
                    className="order-file-input"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                </div>
                {billFile && (
                  <div className="mt-3">
                    <span className="text-success">✅ {billFile.name}</span>
                    <button
                      className="order-remove-file"
                      onClick={() => setBillFile(null)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <div className="order-modal-footer">
                <button
                  className="order-btn order-btn-secondary"
                  onClick={() => {
                    setShowBillModal(false);
                    setBillFile(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="order-btn order-btn-success"
                  onClick={handleUploadAndAccept}
                  disabled={uploading || !billFile}
                >
                  {uploading ? 'Uploading...' : 'Confirm Accept'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bill View Modal ─── */}
      {showBillView && billUrl && (
        <div
          className="order-modal-overlay"
          onClick={() => setShowBillView(false)}
        >
          <div className="order-modal order-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-content">
              <div className="order-modal-header order-header-gradient">
                <h5 className="order-modal-title"><i className="bi bi-file-earmark-text me-2"></i>Bill Document</h5>
                <button className="order-modal-close" onClick={() => setShowBillView(false)}>
                  &times;
                </button>
              </div>
              <div className="order-modal-body text-center">
                {billUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                  <img
                    src={`${SERVERURL}${billUrl}`.replace(/ /g, '%20')}
                    alt="Bill"
                    className="order-bill-image"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <iframe
                    src={`${SERVERURL}${billUrl}`.replace(/ /g, '%20')}
                    className="order-bill-pdf"
                  />
                )}
              </div>
              <div className="order-modal-footer">
                <button className="order-btn order-btn-secondary" onClick={() => setShowBillView(false)}>
                  Close
                </button>
                <a
                  href={`${SERVERURL}${billUrl}`.replace(/ /g, '%20')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="order-btn order-btn-primary"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}