"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import OrderNotificationBell from "./OrderNotificationBell";
import "./StoreSidebar.css";

export default function StoreAppSidebar({ isOpen, onToggle }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "Requests";

  const [isMobile, setIsMobile] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [productsExpandOpen, setProductsExpandOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [storeName, setStoreName] = useState("STORE HUB");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const name =
      localStorage.getItem("storeName") ||
      sessionStorage.getItem("storeName") ||
      "STORE HUB";
    setStoreName(name);
  }, []);

  // Auto‑open dropdowns based on path
  useEffect(() => {
    if (
      pathname.startsWith("/All-store-management/All-Products") ||
      pathname.startsWith("/All-store-management/Store-Product")
    ) {
      setProductsOpen(true);
      setProductsExpandOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (
      pathname.startsWith("/All-store-management/Orders") ||
      pathname.startsWith("/All-store-management/All-Orders") ||
      pathname.startsWith("/All-store-management/Order-Requests")
    ) {
      setOrdersOpen(true);
    }
  }, [pathname]);

  // Responsive check
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ─── Define menu structure ───
  const menuItems = useMemo(
    () => [
      {
        type: "link",
        label: "Dashboard",
        href: "/All-store-management/store-dashboard",
        icon: "bi-speedometer2",
      },
      {
        type: "dropdown",
        label: "Products",
        icon: "bi-box",
        isOpen: productsOpen,
        toggle: () => setProductsOpen((prev) => !prev),
        children: [
          {
            type: "nested",
            label: "Products",
            isOpen: productsExpandOpen,
            toggle: () => setProductsExpandOpen((prev) => !prev),
            children: [
              {
                type: "link",
                label: "All‑Products",
                href: "/All-store-management/All-Products",
                icon: "bi-box-seam",
              },
              {
                type: "link",
                label: "Store Products",
                href: "/All-store-management/Store-Product",
                icon: "bi-shop",
              },
            ],
          },
        ],
      },
      {
        type: "dropdown",
        label: "Orders",
        icon: "bi-cart-check",
        isOpen: ordersOpen,
        toggle: () => setOrdersOpen((prev) => !prev),
        children: [
          {
            type: "link",
            label: "All Orders",
            href: "/All-store-management/All-Orders",
            icon: "bi-circle",
          },
        ],
        // extra: notification bell inside the header
        renderExtra: () => (
          <OrderNotificationBell
            onClick={() => router.push("/All-store-management/Order-Requests")}
            style={{ marginRight: "4px" }}
          />
        ),
      },
    ],
    [productsOpen, productsExpandOpen, ordersOpen]
  );

  // ─── Search filter ───
  const filterItems = (items, term) => {
    if (!term.trim()) return items;
    const lower = term.toLowerCase();
    return items
      .map((item) => {
        if (item.type === "link") {
          return item.label.toLowerCase().includes(lower) ||
            (item.href && item.href.toLowerCase().includes(lower))
            ? item
            : null;
        }
        if (item.type === "dropdown" || item.type === "nested") {
          const filteredChildren = item.children
            ? filterItems(item.children, term)
            : [];
          // keep the parent if any child matches OR label matches
          const labelMatches = item.label.toLowerCase().includes(lower);
          if (filteredChildren.length > 0 || labelMatches) {
            return {
              ...item,
              children: filteredChildren,
            };
          }
          return null;
        }
        return null;
      })
      .filter(Boolean);
  };

  const filteredItems = filterItems(menuItems, searchTerm);

  // Helper to render nested items recursively
  const renderNavItems = (items) => {
    return items.map((item, idx) => {
      if (item.type === "link") {
        const isActive = pathname === item.href;
        return (
          <Link
            key={idx}
            href={item.href}
            className={`store-nav-item ${isActive ? "active" : ""}`}
            onClick={handleNav}
          >
            <i className={`bi ${item.icon}`}></i>
            <span>{item.label}</span>
          </Link>
        );
      }

      if (item.type === "dropdown") {
        const isOpen = item.isOpen;
        const toggle = item.toggle;
        return (
          <div key={idx} className="store-dropdown-parent">
            <div className="store-dropdown-header-wrapper">
              <button className="store-dropdown-main-link" onClick={toggle}>
                <i className={`bi ${item.icon}`}></i>
                <span>{item.label}</span>
              </button>
              <div style={{ display: "flex", alignItems: "center" }}>
                {item.renderExtra && item.renderExtra()}
                <button className="store-chevron-toggle" onClick={toggle}>
                  <i className={`bi bi-chevron-${isOpen ? "up" : "down"}`}></i>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {isOpen && item.children && item.children.length > 0 && (
                <motion.div
                  className="store-dropdown-menu"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={dropdownVariants}
                  style={{ overflow: "hidden", display: "block" }}
                >
                  {renderNavItems(item.children)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }

      if (item.type === "nested") {
        const isOpen = item.isOpen;
        const toggle = item.toggle;
        return (
          <div key={idx} className="store-nested-dropdown">
            <div
              className="store-dropdown-item"
              onClick={toggle}
              style={{ cursor: "pointer", justifyContent: "space-between" }}
            >
              <span>{item.label}</span>
              <i className={`bi bi-chevron-${isOpen ? "up" : "down"}`}></i>
            </div>
            <AnimatePresence>
              {isOpen && item.children && item.children.length > 0 && (
                <motion.div
                  className="store-nested-menu"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={dropdownVariants}
                  style={{ overflow: "hidden", display: "block" }}
                >
                  {renderNavItems(item.children)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }
      return null;
    });
  };

  const toggleProducts = () => setProductsOpen((prev) => !prev);
  const toggleProductsExpand = () => setProductsExpandOpen((prev) => !prev);
  const toggleOrders = () => setOrdersOpen((prev) => !prev);

  const handleNav = () => {
    if (isMobile && onToggle) {
      onToggle();
    }
  };

  const handleLogout = () => {
    window.location.href = "/login";
  };

  const dropdownVariants = {
    hidden: { height: 0, opacity: 0, transition: { duration: 0.2, ease: "easeInOut" } },
    visible: { height: "auto", opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
  };

  return (
    <>
      <button className="store-mobile-menu-btn" onClick={onToggle}>
        <i className={`bi ${isOpen ? "bi-x-lg" : "bi-list"}`}></i>
      </button>

      <aside className={`store-sidebar ${isOpen ? "" : "store-closed"}`}>
        <div className="store-sidebar-header">
          <div className="store-logo-circle">
            <img src="/images/logo.webp" alt="Logo" className="store-logo-img" />
          </div>
          <h2 className="store-logo-text">{storeName}</h2>
        </div>

        {/* Search Bar */}
        <div className="store-sidebar-search">
          <i className="bi bi-search"></i>
          <input
            type="text"
            className="store-sidebar-search-input"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="store-search-clear"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>

        <nav className="store-sidebar-nav">
          {filteredItems.length > 0 ? (
            renderNavItems(filteredItems)
          ) : (
            <div className="store-no-search-results">
              <i className="bi bi-search"></i>
              <span>No results found</span>
            </div>
          )}
        </nav>

        {/* Logout Button */}
        <div className="store-sidebar-footer">
          <button onClick={handleLogout} className="store-logout-btn">
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}