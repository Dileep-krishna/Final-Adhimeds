// components/ThemeToggle.js
'use client';

import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme, THEMES } = useTheme();

  return (
    <div className="d-flex gap-2 align-items-center p-2 border-bottom">
      <span className="fw-semibold text-secondary me-2">Theme:</span>
      <button
        className={`btn btn-sm ${theme === THEMES.LIGHT ? 'btn-primary' : 'btn-outline-secondary'}`}
        onClick={() => toggleTheme(THEMES.LIGHT)}
      >
        ☀️ Light
      </button>
      <button
        className={`btn btn-sm ${theme === THEMES.DARK ? 'btn-primary' : 'btn-outline-secondary'}`}
        onClick={() => toggleTheme(THEMES.DARK)}
      >
        🌙 Dark
      </button>
      <button
        className={`btn btn-sm ${theme === THEMES.GREEN ? 'btn-primary' : 'btn-outline-secondary'}`}
        onClick={() => toggleTheme(THEMES.GREEN)}
      >
        🌿 Green
      </button>
    </div>
  );
}