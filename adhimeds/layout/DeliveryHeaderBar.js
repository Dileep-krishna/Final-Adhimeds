"use client";

import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useDeliveryTheme } from "@/app/Delivery-Head/context/DeliveryThemeContext";
import "./DeliveryHeaderBar.css";

const DeliveryHeaderBar = ({ onToggleSidebar }) => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { theme, toggleTheme } = useDeliveryTheme();

  // ── Sidebar toggle handler ──
  const handleSidebarToggle = () => {
    if (onToggleSidebar) {
      onToggleSidebar(); // calls the parent layout's toggleSidebar
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  return (
    <header className="delivery-header-wrapper">
      <div className="container-fluid py-3 px-3 px-lg-4">
        <div className="delivery-header-row">
          {/* ─── Left section ─── */}
          <div className="delivery-header-left">
            {/* ✅ Sidebar toggle button – click this to hide/show sidebar */}
            <button
              className="sidebar-toggle-btn"
              onClick={handleSidebarToggle}
              aria-label="Toggle sidebar"
            >
              <i className="bi bi-list fs-5"></i>
            </button>
            <Link href="/All-store-management/delivery-dashboard" className="delivery-header-logo-link d-lg-none">
              <Image width={130} height={28} src="/images/logo.webp" alt="Delivery Logo" />
            </Link>
          </div>

          {/* ─── Right section ─── */}
          <div className="delivery-header-right">
            {/* Theme Toggle */}
            <div className="delivery-theme-toggle d-none d-lg-flex align-items-center gap-1">
              <span className="theme-icon">{theme === "dark" ? "🌙" : "☀️"}</span>
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="deliveryThemeSwitch"
                  checked={theme === "dark"}
                  onChange={toggleTheme}
                />
                <label className="form-check-label" htmlFor="deliveryThemeSwitch"></label>
              </div>
            </div>

            <button
              onClick={toggleApplicationMenu}
              className="delivery-mobile-menu-btn d-lg-none"
              aria-label="Open menu"
            >
              <i className="bi bi-three-dots-vertical fs-5"></i>
            </button>

            <div className="delivery-header-notifications d-none d-lg-flex align-items-center gap-2">
              <NotificationDropdown />
            </div>
            <UserDropdown />
          </div>
        </div>

        {isApplicationMenuOpen && (
          <div className="delivery-mobile-dropdown d-lg-none mt-1 pb-2 border-top pt-2">
            <div className="d-flex justify-content-end">
              <NotificationDropdown />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default DeliveryHeaderBar;