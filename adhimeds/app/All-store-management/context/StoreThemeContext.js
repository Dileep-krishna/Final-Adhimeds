// app/All-store-management/context/StoreThemeContext.js
'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';

const STORE_THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

const StoreThemeContext = createContext();

export function StoreThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('storeTheme') || STORE_THEMES.LIGHT;
    }
    return STORE_THEMES.LIGHT;
  });

  const wrapperRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('storeTheme', theme);
    if (wrapperRef.current) {
      wrapperRef.current.classList.remove('light', 'dark');
      wrapperRef.current.classList.add(theme);
    }
  }, [theme]);

  const toggleTheme = (newTheme) => {
    if (newTheme && Object.values(STORE_THEMES).includes(newTheme)) {
      setTheme(newTheme);
    } else {
      const next = theme === STORE_THEMES.LIGHT ? STORE_THEMES.DARK : STORE_THEMES.LIGHT;
      setTheme(next);
    }
  };

  return (
    <StoreThemeContext.Provider value={{ theme, toggleTheme, STORE_THEMES }}>
      <div ref={wrapperRef} className="store-theme-wrapper">
        {children}
      </div>
    </StoreThemeContext.Provider>
  );
}

export function useStoreTheme() {
  const context = useContext(StoreThemeContext);
  if (!context) throw new Error('useStoreTheme must be used within a StoreThemeProvider');
  return context;
}