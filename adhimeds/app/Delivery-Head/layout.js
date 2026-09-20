"use client";

import { useState } from "react";
import { DeliveryThemeProvider, useDeliveryTheme } from "./context/DeliveryThemeContext";
import DeliveryHeaderBar from "@/layout/DeliveryHeaderBar";
import DeliveryAppBar from "@/layout/DeliveryAppBar";
import Backdrop from "@/layout/Backdrop";
import "./delivery-layout.css";
import "./delivery-theme.css";

function DeliveryLayoutContent({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useDeliveryTheme();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className={`delivery-theme-wrapper ${theme === "dark" ? "delivery-dark" : ""}`} suppressHydrationWarning>
      <div className="delivery-layout-wrapper" suppressHydrationWarning>
        <DeliveryAppBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Backdrop show={sidebarOpen} onClick={toggleSidebar} />
        <div className="delivery-main-content" suppressHydrationWarning>
          <DeliveryHeaderBar onToggleSidebar={toggleSidebar} />
          <div className="container-fluid p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryHeadLayout({ children }) {
  return (
    <DeliveryThemeProvider>
      <DeliveryLayoutContent>{children}</DeliveryLayoutContent>
    </DeliveryThemeProvider>
  );
}