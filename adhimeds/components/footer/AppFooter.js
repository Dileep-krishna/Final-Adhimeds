"use client";

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <p>© {currentYear} ADHIMEDICINE v1.0.0</p>
    </footer>
  );
}