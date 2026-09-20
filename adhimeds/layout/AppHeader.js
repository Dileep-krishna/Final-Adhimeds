"use client";

import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import "./AppHeader.css";

export default function AppHeader() {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const {
    isExpanded,
    isMobileOpen,
    toggleSidebar,
    toggleMobileSidebar,
  } = useSidebar();

  const { theme, toggleTheme, THEMES } = useTheme();

  // ─── Detect mobile on client side ───
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 992);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleToggle = () => {
    if (isMobile) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  };

  const getThemeIcon = () => {
    if (theme === THEMES.DARK) return "bi-moon-fill";
    if (theme === THEMES.GREEN) return "bi-tree-fill";
    return "bi-sun-fill";
  };

  // ─── Safe styles (no direct window access) ───
  const left = isMobile ? "0" : isExpanded ? "280px" : "90px";
  const width = isMobile
    ? "100%"
    : `calc(100% - ${isExpanded ? "280px" : "90px"})`;

  return (
    <header className="app-header" style={{ left, width }}>
      <div className="container-fluid px-3 px-lg-4">
        <div className="d-flex justify-content-between align-items-center h-100">
          <div className="d-flex align-items-center gap-2">
            <button className="btn app-header-btn" onClick={handleToggle}>
              {isMobileOpen ? (
                <i className="bi bi-x-lg fs-5"></i>
              ) : (
                <i className="bi bi-list fs-5"></i>
              )}
            </button>
            <Link href="/" className="d-lg-none">
              <Image
                src="/images/logo.webp"
                width={150}
                height={32}
                alt="Logo"
              />
            </Link>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn app-header-btn d-lg-none"
              onClick={() =>
                setApplicationMenuOpen(!isApplicationMenuOpen)
              }
            >
              <i className="bi bi-three-dots-vertical"></i>
            </button>
            <div className="d-none d-lg-flex align-items-center gap-2">
              <NotificationDropdown />
            </div>
            <button
              className="btn app-header-btn theme-toggle-btn"
              onClick={toggleTheme}
            >
              <i className={`bi ${getThemeIcon()} fs-5`} />
            </button>
            <UserDropdown />
          </div>
        </div>
        {isApplicationMenuOpen && (
          <div className="d-lg-none border-top pt-2 pb-2">
            <NotificationDropdown />
          </div>
        )}
      </div>
    </header>
  );
}