"use client";

export default function NotificationsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
        <button className="btn-primary"><i className="bi bi-check2-all"></i> Mark All Read</button>
      </div>
      <div className="notifications-list">
        <div className="notification-item unread">
          <i className="bi bi-cart-check"></i>
          <div><h4>New Order Received</h4><p>Order #ORD-006 placed by John Doe. Amount: $299</p><small>5 minutes ago</small></div>
        </div>
        <div className="notification-item">
          <i className="bi bi-shop"></i>
          <div><h4>Vendor Registered</h4><p>City Medicals registered. Verify documents.</p><small>1 hour ago</small></div>
        </div>
      </div>
      <style jsx>{`
        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .notification-item {
          background: white;
          border-radius: 1rem;
          padding: 1.25rem;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }
        .notification-item.unread {
          border-left: 4px solid #3b82f6;
          background: #eff6ff;
        }
        .notification-item i {
          font-size: 1.5rem;
          color: #3b82f6;
        }
        .notification-item h4 {
          margin: 0 0 0.25rem;
        }
        .notification-item p {
          margin: 0;
          color: #64748b;
        }
        .notification-item small {
          color: #94a3b8;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}