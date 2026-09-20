"use client";

import { useSidebar } from "@/context/SidebarContext";

const Backdrop = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1040,
        transition: "0.3s",
      }}
      onClick={toggleMobileSidebar}
    />
  );
};

export default Backdrop;