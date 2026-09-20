"use client";

import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { useSidebar } from "@/context/SidebarContext";
import { SuperAdminThemeProvider } from "@/context/ThemeContext";
import "./styles/super-admin-theme.css";
import AppFooter from "@/components/footer/AppFooter";
import "./super-admin.css";

export default function AdminLayout({ children }) {
  const { isExpanded } = useSidebar();

  return (
    <SuperAdminThemeProvider>   
      <div
        className={`super-layout-wrapper ${
          isExpanded ? "sidebar-expanded" : "sidebar-collapsed"
        }`}
      >
        <AppSidebar />
        <Backdrop />
        <div className="super-main-content">
          <AppHeader />
          <main className="super-page-content">
            <div className="container-fluid px-4 py-3">
              {children}
            </div>
            <div className="footer-full-width">
              <AppFooter />
            </div>
          </main>
        </div>
      </div>
    </SuperAdminThemeProvider>
  );
}