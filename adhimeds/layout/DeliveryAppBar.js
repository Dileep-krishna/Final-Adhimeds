"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import "./DeliverySidebar.css";

export default function DeliveryHeadSidebar({ isOpen, onToggle }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isMobile, setIsMobile] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Auto‑open orders dropdown when on orders pages
  useEffect(() => {
    if (
      pathname.startsWith("/Delivery-Head/All-Order") ||
      pathname.startsWith("/Delivery-Head/Order-Requests") ||
      pathname.startsWith("/Delivery-Head/Orders")
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

  // ── Define menu structure ──
  const menuItems = useMemo(
    () => [
      {
        type: "link",
        label: "Delivery Dashboard",
        href: "/Delivery-Head/dashboard",
        icon: "bi-speedometer2",
      },
      {
        type: "link",
        label: "Delivery Boys",
        href: "/Delivery-Head/delivery-boys",
        icon: "bi-people",
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
            href: "/Delivery-Head/All-Orders",
            icon: "bi-circle",
          },
          {
            type: "link",
            label: "Pending Requests",
            href: "/Delivery-Head/Order-Requests",
            icon: "bi-circle",
          },
        ],
      },
    ],
    [ordersOpen]
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
        if (item.type === "dropdown") {
          const filteredChildren = item.children
            ? filterItems(item.children, term)
            : [];
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

  // ─── Render helpers ───
  const renderNavItems = (items) => {
    return items.map((item, idx) => {
      if (item.type === "link") {
        const isActive = pathname === item.href;
        return (
          <Link
            key={idx}
            href={item.href}
            className={`delivery-nav-item ${isActive ? "active" : ""}`}
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
          <div key={idx} className="delivery-dropdown-parent">
            <div className="delivery-dropdown-header-wrapper">
              <button
                className="delivery-dropdown-main-link"
                onClick={toggle}
                style={{ position: "relative" }}
              >
                <i className={`bi ${item.icon}`}></i>
                <span>{item.label}</span>
              </button>
              <button className="delivery-chevron-toggle" onClick={toggle}>
                <i className={`bi bi-chevron-${isOpen ? "up" : "down"}`}></i>
              </button>
            </div>

            <AnimatePresence>
              {isOpen && item.children && item.children.length > 0 && (
                <motion.div
                  className="delivery-dropdown-menu"
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
      <button className="delivery-mobile-menu-btn" onClick={onToggle}>
        <i className={`bi ${isOpen ? "bi-x-lg" : "bi-list"}`}></i>
      </button>

      <aside className={`delivery-sidebar ${isOpen ? "" : "delivery-closed"}`}>
        <div className="delivery-sidebar-header">
          <div className="delivery-logo-circle">
            <img src="/images/logo.webp" alt="Logo" className="delivery-logo-img" />
          </div>
          <h2 className="delivery-logo-text">DELIVERY HUB</h2>
        </div>

        {/* ─── Search Bar ─── */}
        <div className="delivery-sidebar-search">
          <i className="bi bi-search"></i>
          <input
            type="text"
            className="delivery-sidebar-search-input"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="delivery-search-clear"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>

        <nav className="delivery-sidebar-nav">
          {filteredItems.length > 0 ? (
            renderNavItems(filteredItems)
          ) : (
            <div className="delivery-no-search-results">
              <i className="bi bi-search"></i>
              <span>No results found</span>
            </div>
          )}
        </nav>

        {/* Logout Button */}
        <div className="delivery-sidebar-footer">
          <button onClick={handleLogout} className="delivery-logout-btn">
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}