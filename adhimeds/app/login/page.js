"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import "./login.css";
import SERVERURL from "../services/serverURL";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ─── Helper: set token in cookie + storage ───
  const setAuthData = (token, adminData, remember) => {
    // 1. Set cookie (for middleware)
    document.cookie = `token=${token}; path=/; max-age=${remember ? 86400 : 3600}; SameSite=Lax`; // 1 day / 1 hour

    // 2. Set storage
    if (remember) {
      localStorage.setItem("adminToken", token);
      localStorage.setItem("admin", JSON.stringify(adminData));
      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("admin");
    } else {
      sessionStorage.setItem("adminToken", token);
      sessionStorage.setItem("admin", JSON.stringify(adminData));
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin");
    }
  };

  // ─── Login handler ───
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }
    setIsLoading(true);

    const backendUrl = `${SERVERURL}/api/login`;
    console.log("🌐 Fetching URL:", backendUrl);

    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const rawText = await response.text();
      try {
        const data = JSON.parse(rawText);
        if (data.success) {
          // Set cookie + storage
          setAuthData(data.data.token, data.data.admin, rememberMe);

          toast.success("Login successful!");
          router.push("/super-admin/dashboard");
        } else {
          toast.error(data.message || "Invalid credentials");
        }
      } catch (jsonError) {
        toast.error("Server returned invalid response.");
      }
    } catch (error) {
      toast.error("Cannot connect to backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast("Password reset link would be sent to your email (demo).", { icon: "🔐" });
  };

  // ─── Render ─── (unchanged from your code)
  const backgroundImageUrl = "/images/login.avif";

  return (
    <div className="login-page container-fluid vh-100 p-0 overflow-hidden">
      <Toaster position="top-right" />
      <div className="row g-0 h-100">
        {/* LEFT SIDE */}
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
          ></div>
          <div className="text-center text-white position-relative z-1 px-4 animate-fade-up">
            <div className="mb-4 animate-float">
              <img
                src="/images/logo.webp"
                alt="Animated Logo"
                width="100"
                height="100"
                className="rounded-3 shadow-lg animate-pulse"
                style={{ objectFit: "contain" }}
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
            <h1 className="display-4 fw-bold mb-2">ADHIMEDICINE</h1>
            <p className="lead mb-3">ADHIVEDA PHARMACEUTICAL PVT LTD</p>
            <div className="w-25 bg-white mx-auto my-3" style={{ height: "2px" }}></div>
            <p className="opacity-75">Trusted Healthcare Partner</p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="col-12 col-lg-6 d-flex justify-content-center align-items-center bg-light p-4">
          <div
            className="card border-0 shadow-lg w-100 animate-zoom-in"
            style={{ maxWidth: "480px" }}
          >
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4 animate-fade-up">
                <div className="mx-auto mb-3" style={{ width: "80px", height: "80px" }}>
                  <img
                    src="/images/logo.webp"
                    alt="Company Logo"
                    className="w-100 h-100 object-fit-contain rounded-3 shadow-sm"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                </div>
                <h1 className="h2 fw-bold text-primary">ADHIMEDICINE</h1>
                <p className="text-secondary">ADHIVEDA PHARMACEUTICAL PVT LTD</p>
                <div className="w-25 bg-primary mx-auto my-3" style={{ height: "2px", opacity: 0.3 }}></div>
                <p className="text-muted small">Secure access to your medical dashboard</p>
              </div>

              <form onSubmit={handleLogin}>
                <div className="mb-3 animate-fade-up delay-100">
                  <label className="form-label fw-semibold">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0 ps-0"
                      placeholder="admin@adhimeds.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="mb-3 animate-fade-up delay-200">
                  <label className="form-label fw-semibold">Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control border-start-0 ps-0"
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4 animate-fade-up delay-300">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                    />
                    <label className="form-check-label text-secondary" htmlFor="rememberMe">
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="btn btn-link p-0 text-decoration-none text-primary"
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn btn-dark w-100 py-2 rounded-pill fw-semibold animate-fade-up delay-400"
                  style={{ backgroundColor: "#0a2b4e", borderColor: "#0a2b4e" }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Logging in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              <div className="mt-4 text-center animate-fade-up delay-500">
                <button
                  onClick={() => router.back()}
                  className="btn btn-link text-secondary text-decoration-none p-0"
                  disabled={isLoading}
                >
                  ← Back to previous page
                </button>
              </div>

              <div className="mt-3 text-center small text-muted animate-fade-up delay-600">
                Demo: admin@adhimeds.com / Admin@123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}