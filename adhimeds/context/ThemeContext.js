// context/ThemeContext.js
'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';

const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  GREEN: 'green',
};

const ThemeContext = createContext();

// ─── Provider for super‑admin (wraps content inside .super-admin-wrapper) ───
export function SuperAdminThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || THEMES.LIGHT;
    }
    return THEMES.LIGHT;
  });

  const wrapperRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (wrapperRef.current) {
      wrapperRef.current.classList.remove('light', 'dark', 'green');
      wrapperRef.current.classList.add(theme);
    }
  }, [theme]);

  const toggleTheme = (newTheme) => {
    if (newTheme && Object.values(THEMES).includes(newTheme)) {
      setTheme(newTheme);
    } else {
      const values = Object.values(THEMES);
      const currentIndex = values.indexOf(theme);
      setTheme(values[(currentIndex + 1) % values.length]);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, THEMES }}>
      <div ref={wrapperRef} className="super-admin-wrapper">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// ─── Global provider (fallback, does nothing special) ───
export function ThemeProvider({ children }) {
  // This provider is for pages that don't need dark mode (store, delivery, pharma)
  // It just passes through without applying any classes.
  const dummyTheme = 'light';
  const dummyToggle = () => {};
  return (
    <ThemeContext.Provider value={{ theme: dummyTheme, toggleTheme: dummyToggle, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}