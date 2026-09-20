"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCurrentAdminAPI } from "@/app/services/adminLoginAPI";
import { buildAvatarUrl } from "@/utils/avatar";

const UserDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  // ── Fetch admin profile ──
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getCurrentAdminAPI();
        if (res.success) {
          setUser(res.data);
        } else {
          console.warn("Failed to fetch user:", res.message);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // ── Click outside to close ──
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Build avatar URL ──
  const avatarUrl = user?.avatar ? buildAvatarUrl(user.avatar) : null;

  // ── Logout handler (clears everything) ──
  const handleLogout = () => {
    // 1. Clear cookie (for middleware)
    document.cookie = 'token=; path=/; max-age=0';

    // 2. Clear localStorage
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');

    // 3. Clear sessionStorage
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('admin');

    // 4. Redirect to login
    window.location.href = '/login';
  };

  // ── Display fallback while loading ──
  if (loading) {
    return (
      <div className="position-relative">
        <button
          className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0 overflow-hidden"
          style={{ width: "2.5rem", height: "2.5rem" }}
          disabled
        >
          <span className="spinner-border spinner-border-sm" role="status" />
        </button>
      </div>
    );
  }

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0 overflow-hidden"
        style={{ width: "2.5rem", height: "2.5rem" }}
        aria-label="User menu"
      >
        {!imgError && avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user?.name || "User"}
            width={40}
            height={40}
            style={{ objectFit: "cover" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <i className="bi bi-person-circle fs-4"></i>
        )}
      </button>

      {isOpen && (
        <div
          className="position-absolute end-0 mt-2 bg-white border rounded shadow-sm"
          style={{ minWidth: "220px", zIndex: 1050 }}
        >
          <div className="py-1">
            {/* User info header */}
            <div className="px-3 py-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                {avatarUrl && !imgError ? (
                  <img
                    src={avatarUrl}
                    alt={user?.name || "User"}
                    width={32}
                    height={32}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <i className="bi bi-person-circle fs-4"></i>
                )}
                <div>
                  <div className="fw-semibold small">{user?.name || "Admin"}</div>
                  <div className="text-muted small" style={{ fontSize: "0.7rem" }}>
                    {user?.email || ""}
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/super-admin/profile"
              className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-decoration-none"
              onClick={() => setIsOpen(false)}
            >
              <i className="bi bi-person"></i> Profile
            </Link>
            <Link
              href="/settings"
              className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-decoration-none"
              onClick={() => setIsOpen(false)}
            >
              <i className="bi bi-gear"></i> Settings
            </Link>
            <hr className="my-1" />
            <button
              onClick={handleLogout}
              className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-danger"
              style={{ background: "none", border: "none", width: "100%", textAlign: "left" }}
            >
              <i className="bi bi-box-arrow-right"></i> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;