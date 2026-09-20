"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const handleClick = () => {
    toggleDropdown();
    setNotifying(false);
  };

  return (
    <div className="dropdown position-relative d-inline-block">
      <button
        className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center position-relative"
        onClick={handleClick}
        style={{ width: "2.75rem", height: "2.75rem" }}
        aria-expanded={isOpen}
      >
        {/* Notification badge */}
        {notifying && (
          <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
            <span className="visually-hidden">New notifications</span>
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="dropdown-menu show position-absolute end-0 mt-2 p-0 border rounded-3 shadow-lg"
          style={{
            width: "350px",
            maxWidth: "calc(100vw - 2rem)",
            zIndex: 1050,
          }}
        >
          <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
            <h5 className="h6 fw-semibold mb-0">Notification</h5>
            <button
              onClick={toggleDropdown}
              className="btn-close text-reset"
              style={{ fontSize: "0.8rem" }}
              aria-label="Close"
            ></button>
          </div>

          <ul className="list-unstyled mb-0 overflow-auto" style={{ maxHeight: "480px" }}>
            {/* Example notifications – you can map from real data */}
            <li>
              <Link
                href="#"
                className="dropdown-item d-flex gap-3 align-items-start p-3 border-bottom text-decoration-none"
                onClick={closeDropdown}
              >
                <div className="position-relative flex-shrink-0">
                  <Image
                    width={40}
                    height={40}
                    src="/images/user/user-02.jpg"
                    alt="User"
                    className="rounded-circle object-fit-cover"
                  />
                  <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-white rounded-circle"></span>
                </div>
                <div className="flex-grow-1">
                  <p className="small text-secondary mb-1">
                    <strong className="text-dark">Terry Franci</strong> requests permission to change{" "}
                    <strong className="text-dark">Project - Nganter App</strong>
                  </p>
                  <div className="d-flex align-items-center gap-2 text-muted small">
                    <span>Project</span>
                    <span className="bg-secondary rounded-circle" style={{ width: 4, height: 4 }}></span>
                    <span>5 min ago</span>
                  </div>
                </div>
              </Link>
            </li>
            {/* Add more items similarly – keep structure but you can shorten for brevity */}
          </ul>

          <div className="p-2 border-top text-center">
            <Link
              href="/"
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={closeDropdown}
            >
              View All Notifications
            </Link>
          </div>
        </div>
      )}

      {/* Dark mode overrides (matches your existing ThemeContext) */}
      <style jsx>{`
        .btn-outline-secondary {
          border-color: #e5e7eb;
          color: #6b7280;
        }
        .btn-outline-secondary:hover {
          background-color: #f3f4f6;
          color: #1f2937;
        }
        .dropdown-menu {
          background-color: white;
          border-color: #e5e7eb;
        }
        .dropdown-item {
          color: #4b5563;
        }
        .dropdown-item:hover {
          background-color: #f9fafb;
          color: #111827;
        }
        :global(.dark) .btn-outline-secondary {
          border-color: #374151;
          color: #9ca3af;
        }
        :global(.dark) .btn-outline-secondary:hover {
          background-color: #1f2937;
          color: #ffffff;
        }
        :global(.dark) .dropdown-menu {
          background-color: #1f2937;
          border-color: #374151;
        }
        :global(.dark) .dropdown-item {
          color: #9ca3af;
        }
        :global(.dark) .dropdown-item:hover {
          background-color: #374151;
          color: #ffffff;
        }
        :global(.dark) .border-bottom,
        :global(.dark) .border-top {
          border-color: #374151 !important;
        }
        :global(.dark) .text-dark {
          color: #f3f4f6 !important;
        }
        :global(.dark) .text-secondary {
          color: #9ca3af !important;
        }
        .object-fit-cover {
          object-fit: cover;
        }
      `}</style>
    </div>
  );
}