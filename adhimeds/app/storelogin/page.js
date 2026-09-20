"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import "./storelogin.css";
import SERVERURL from "../services/serverURL";
import { joinStoreRoom } from "../services/socket.js"; // ✅ Socket helper

export default function StoreLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Enhanced validation
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SERVERURL}/api/store/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailAddress: email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Use cookie-based approach or secure storage
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", data.token);
        storage.setItem("storeId", data.storeId);
        storage.setItem("shopid", data.shopid || "");
        storage.setItem("storeName", data.storeName);
        storage.setItem("storeEmail", email);
        storage.setItem("district", data.district || "");

        // ✅ Join the store's Socket.IO room – auto‑detects ObjectId from token
        joinStoreRoom(); // No argument – reads from token

        toast.success("Login successful! Redirecting...");
        setTimeout(() => {
          router.replace("/All-store-management/store-dashboard");
        }, 1000);
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info("Password reset link will be sent to your email.");
    // router.push("/All-store-management/forgot-password");
  };

  const backgroundImageUrl =
    " /images/login.avif";

  return (
<div className="store-login-page container-fluid vh-100 p-0 overflow-hidden">
      <Toaster position="top-right" />
      <div className="row g-0 h-100">
        {/* LEFT SIDE – Medical Store Theme */}
        <div
          className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center position-relative"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{ backgroundColor: "rgba(10, 25, 47, 0.65)" }}
          />
          <div className="text-center text-white position-relative z-1 px-4">
            <div className="mb-4">
              <img
                src="/images/logo.webp"
                alt="Store Logo"
                width="100"
                height="100"
                className="rounded-3 shadow-lg"
                style={{ objectFit: "contain" }}
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
            <h1 className="display-4 fw-bold mb-2">MEDICAL STORE</h1>
            <p className="lead mb-3">Your Trusted Pharmacy Partner</p>
            <div className="w-25 bg-white mx-auto my-3" style={{ height: "2px" }} />
            <p className="opacity-75">24/7 Healthcare & Medicine Delivery</p>
          </div>
        </div>

        {/* RIGHT SIDE – Store Login Form */}
        <div className="col-12 col-lg-6 d-flex justify-content-center align-items-center bg-light p-4">
          <div className="card border-0 shadow-lg w-100" style={{ maxWidth: "480px" }}>
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="mx-auto mb-3" style={{ width: "80px", height: "80px" }}>
                  <img
                    src="/images/logo.webp"
                    alt="Company Logo"
                    className="w-100 h-100 object-fit-contain rounded-3 shadow-sm"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                </div>
                <h1 className="h2 fw-bold text-primary">Store Login</h1>
                <p className="text-secondary">Access your pharmacy management dashboard</p>
                <div className="w-25 bg-primary mx-auto my-3" style={{ height: "2px", opacity: 0.3 }} />
                <p className="text-muted small">Secure login for registered medical stores</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="bi bi-envelope" />
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0 ps-0"
                      placeholder="store@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="bi bi-lock" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control border-start-0 ps-0"
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      <i className={`bi bi-eye${showPassword ? "" : "-slash"}`} />
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="rememberStore"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label className="form-check-label text-secondary" htmlFor="rememberStore">
                      Keep me logged in
                    </label>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none text-primary"
                    onClick={handleForgotPassword}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn btn-dark w-100 py-2 rounded-pill fw-semibold"
                  style={{ backgroundColor: "#0a2b4e", borderColor: "#0a2b4e" }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In to Store"
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => router.back()}
                  className="btn btn-link text-secondary text-decoration-none p-0"
                >
                  ← Back to previous page
                </button>
              </div>

              <div className="mt-3 text-center small text-muted">
                Demo store: store@medical.com / password123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}