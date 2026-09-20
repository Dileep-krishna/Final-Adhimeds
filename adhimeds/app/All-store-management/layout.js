"use client";

import { useState } from "react";
import { StoreThemeProvider } from "./context/StoreThemeContext";   // 👈 fixed path
import StoreAppSidebar from "./components/StoreAppSidebar";
import StoreAppHeader from "./components/StoreAppHeader";
import "./StoreLayout.css";
import "./store-theme.css";   // 👈 import your store theme CSS

export default function StoreLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <StoreThemeProvider>
      <div className="store-layout-container">
        <StoreAppSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <div className="store-main-wrapper">
          <StoreAppHeader isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
          <main className="store-main-content">{children}</main>
        </div>
      </div>
    </StoreThemeProvider>
  );
}