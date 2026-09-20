"use client";

import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useStoreTheme } from "../context/StoreThemeContext";   // 👈 relative path  // 👈 import store theme
import "./StoreAppHeader.css";

const StoreAppHeader = ({ isSidebarOpen, onToggleSidebar }) => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { theme, toggleTheme, STORE_THEMES } = useStoreTheme();   // 👈 use store theme

  const handleToggle = () => {
    onToggleSidebar();
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  return (
    <header className="sticky-top bg-white  border-bottom shadow-sm store-header-wrapper">
      <div className="container-fluid  px-3 px-lg-4">
        <div className="d-flex align-items-center justify-content-between py-2 py-lg-3">
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
              onClick={handleToggle}
              style={{ width: "2.5rem", height: "2.5rem" }}
            >
              {isSidebarOpen ? (
                <i className="bi bi-x-lg fs-5"></i>
              ) : (
                <i className="bi bi-list fs-5"></i>
              )}
            </button>
            <Link href="/All-store-management/store-dashboard" className="d-lg-none">
              <Image width={154} height={32} src="/images/logo.webp" alt="Store Logo" />
            </Link>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              onClick={toggleApplicationMenu}
              className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center d-lg-none"
              style={{ width: "2.5rem", height: "2.5rem" }}
            >
              <i className="bi bi-three-dots-vertical fs-5"></i>
            </button>

            <div className="d-none d-lg-flex align-items-center gap-2">
              <NotificationDropdown />
            </div>

            {/* 👇 Theme toggle button */}
            <button
              className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
              onClick={() => toggleTheme()}
              style={{ width: "2.5rem", height: "2.5rem" }}
              title={`Current theme: ${theme}`}
            >
              <i className={`bi ${theme === STORE_THEMES.DARK ? 'bi-moon-fill' : 'bi-sun-fill'} fs-5`} />
            </button>

            <UserDropdown />
          </div>
        </div>

        {isApplicationMenuOpen && (
          <div className="d-lg-none mt-2 pb-2 border-top pt-2">
            <div className="d-flex justify-content-end">
              <NotificationDropdown />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default StoreAppHeader;