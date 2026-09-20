"use client";

import { useEffect } from "react";
import { useOrderNotifications } from "@/context/OrderNotificationContext";
import "./OrderNotificationBell.css";

export default function OrderNotificationBell() {
  const { unreadCount, isRinging, playNotificationSound } = useOrderNotifications();

  // Log state changes
  useEffect(() => {
    console.log(`🛎️ Bell: unreadCount=${unreadCount}, isRinging=${isRinging}`);
    if (isRinging) {
      console.log("🔔 Bell is ringing – playing sound");
      playNotificationSound();
    } else {
      console.log("🔕 Bell stopped ringing");
    }
  }, [isRinging, playNotificationSound, unreadCount]);

  return (
    <div className="order-notification-bell" style={{ position: "relative", display: "inline-block" }}>
      <div 
        className={`bell-icon ${isRinging ? "ringing" : ""}`}
        style={{ cursor: "pointer", fontSize: "1.8rem", position: "relative" }}
      >
        <i className="bi bi-bell-fill"></i>
        {unreadCount > 0 && (
          <span 
            className="badge bg-danger rounded-pill" 
            style={{
              position: "absolute",
              top: "-10px",
              right: "-12px",
              fontSize: "0.7rem",
              minWidth: "20px",
              padding: "2px 6px",
            }}
          >
            {unreadCount}
          </span>
        )}
        {isRinging && (
          <span 
            className="ringing-dot"
            style={{
              position: "absolute",
              bottom: "-4px",
              right: "-4px",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: "red",
              animation: "pulse 0.8s infinite",
              boxShadow: "0 0 8px red",
            }}
          />
        )}
      </div>
    </div>
  );
}