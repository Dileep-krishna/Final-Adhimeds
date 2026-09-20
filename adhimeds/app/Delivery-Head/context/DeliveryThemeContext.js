"use client";

import { createContext, useContext, useState, useEffect } from "react";

const DeliveryThemeContext = createContext();

export function DeliveryThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("delivery-theme") || "light";
    }
    return "light";
  });

  useEffect(() => {
    localStorage.setItem("delivery-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <DeliveryThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </DeliveryThemeContext.Provider>
  );
}

export function useDeliveryTheme() {
  const context = useContext(DeliveryThemeContext);
  if (!context) {
    throw new Error("useDeliveryTheme must be used within a DeliveryThemeProvider");
  }
  return context;
}