"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Select from "react-select";
import "./stafflogin.css";
import SERVERURL from "../services/serverURL";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [roles, setRoles] = useState([]);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [mounted, setMounted] = useState(false); // Only added to fix build error
  const redirectTimeout = useRef(null);
  const abortControllerRef = useRef(null);

  // Only added to fix build error - no functionality change
  useEffect(() => {
    setMounted(true);
  }, []);

  // Role-based navigation mapping
  const getDashboardRoute = useCallback((role) => {
    const roleRoutes = {
      'PHARMACIST': '/pharma-dashboard',
      'DELIVERY BOY': '/Delivery-boy/dashboard',
      'DELIVERY HEAD': '/Delivery-Head/dashboard',
      'ADMIN': '/admin-dashboard'
    };
    return roleRoutes[role] || '/unauthorized';
  }, []);

  // Fetch roles with abort controller for cleanup
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        
        const response = await fetch(`${SERVERURL}/api/roles`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: abortControllerRef.current.signal,
          cache: 'force-cache'
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          const roleOptions = data.data.map(role => ({
            value: role.name,
            label: role.name,
            id: role._id
          }));
          setRoles(roleOptions);
          sessionStorage.setItem('cachedRoles', JSON.stringify(roleOptions));
        } else {
          const cachedRoles = sessionStorage.getItem('cachedRoles');
          if (cachedRoles) {
            setRoles(JSON.parse(cachedRoles));
            toast.success('Roles loaded from cache');
          } else {
            toast.error("No roles available");
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching roles:", error);
          const cachedRoles = sessionStorage.getItem('cachedRoles');
          if (cachedRoles) {
            setRoles(JSON.parse(cachedRoles));
            toast.success('Using cached roles');
          } else {
            toast.error("Failed to load roles. Please refresh.");
          }
        }
      } finally {
        setLoadingRoles(false);
      }
    };

    const cachedRoles = sessionStorage.getItem('cachedRoles');
    if (cachedRoles) {
      setRoles(JSON.parse(cachedRoles));
      setLoadingRoles(false);
    }
    
    fetchRoles();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeout.current) clearTimeout(redirectTimeout.current);
    };
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (loading) return;

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    
    if (!password.trim()) {
      toast.error("Please enter your password");
      return;
    }

    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${SERVERURL}/api/staff/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        const userRole = data.data.role;
        const selectedRoleName = selectedRole.value;
        
        console.log("User role from DB:", userRole);
        console.log("Selected role:", selectedRoleName);
        
        if (userRole.toUpperCase() !== selectedRoleName.toUpperCase()) {
          toast.error(`Invalid role selection! You are logged in as ${userRole}. Please select the correct role.`);
          setLoading(false);
          return;
        }
        
        // ----- START: NEW DISTRICT HANDLING -----
        // Extract district from response (if available)
        const staffDistrict = data.data.district || 'Not specified';
        // ----- END: NEW DISTRICT HANDLING -----

        const storage = rememberMe ? localStorage : sessionStorage;
        
        storage.setItem("staffToken", data.data.token);
        storage.setItem("staffRole", data.data.role);
        storage.setItem("staffName", data.data.fullName);
        storage.setItem("staffId", data.data._id);
        storage.setItem("userRole", userRole);
        // ----- Store district for later use -----
        storage.setItem("staffDistrict", staffDistrict);
        
        // ----- Console log the district -----
        console.log(`✅ Staff district: ${staffDistrict}`);
        // ----- Optionally show a toast with district (for visibility) -----
        toast.success(`Welcome ${data.data.fullName}! (District: ${staffDistrict})`);
        
        const dashboardRoute = getDashboardRoute(userRole);
        
        // Keep the standard welcome toast as well (optional)
        // toast.success(`Welcome ${data.data.fullName}! Redirecting to ${userRole} dashboard...`);
        
        if (redirectTimeout.current) clearTimeout(redirectTimeout.current);
        
        redirectTimeout.current = setTimeout(() => {
          router.push(dashboardRoute);
        }, 800);
      } else {
        toast.error(data.message || "Invalid email or password");
        setLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Server error. Please try again later.");
      setLoading(false);
    }
  }, [email, password, selectedRole, rememberMe, loading, router, getDashboardRoute]);

  const customSelectStyles = useMemo(() => ({
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? '#0a2b4e' : '#dee2e6',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(10, 43, 78, 0.25)' : 'none',
      '&:hover': { borderColor: '#0a2b4e' },
      minHeight: '42px',
      backgroundColor: 'white',
      cursor: 'pointer'
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected ? '#0a2b4e' : isFocused ? '#f0f0f0' : 'white',
      color: isSelected ? 'white' : '#212529',
      padding: '10px 12px',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#0a2b4e',
        color: 'white'
      }
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      backgroundColor: 'white',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      borderRadius: '4px',
      marginTop: '4px'
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: '200px',
      overflowY: 'auto'
    }),
    placeholder: (base) => ({
      ...base,
      color: '#6c757d'
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: '#0a2b4e',
      cursor: 'pointer'
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: '#dee2e6'
    })
  }), []);

  const backgroundImageUrl = " /images/login.avif";

  return (
<div className="staff-login-page container-fluid vh-100 p-0 overflow-hidden">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="row g-0 h-100">
        {/* LEFT SIDE – Branding */}
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
                alt="Company Logo"
                width="100"
                height="100"
                className="rounded-3 shadow-lg animate-pulse"
                style={{ objectFit: "contain" }}
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
            <h1 className="display-4 fw-bold mb-2">STAFF PORTAL</h1>
            <p className="lead mb-3">Employee Access Only</p>
            <div className="w-25 bg-white mx-auto my-3" style={{ height: "2px" }}></div>
            <p className="opacity-75">Secure internal dashboard for our team</p>
          </div>
        </div>

        {/* RIGHT SIDE – Staff Login Form */}
        <div className="col-12 col-lg-6 d-flex justify-content-center align-items-center bg-light p-4">
          <div
            className="card border-0 shadow-lg w-100 animate-zoom-in"
            style={{ maxWidth: "480px", position: "relative", zIndex: 1 }}
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
                <h1 className="h2 fw-bold text-primary">Staff Login</h1>
                <p className="text-secondary">Access your work dashboard</p>
                <div className="w-25 bg-primary mx-auto my-3" style={{ height: "2px", opacity: 0.3 }}></div>
                <p className="text-muted small">Use your company credentials</p>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Role Selection */}
                <div className="mb-3 animate-fade-up delay-100" style={{ position: "relative", zIndex: 10 }}>
                  <label className="form-label fw-semibold">
                    Select Role <span className="text-danger">*</span>
                  </label>
                  <Select
                    options={roles}
                    value={selectedRole}
                    onChange={setSelectedRole}
                    isLoading={loadingRoles}
                    isDisabled={loadingRoles}
                    placeholder={loadingRoles ? "Loading roles..." : "Choose your role..."}
                    noOptionsMessage={() => "No roles available"}
                    styles={customSelectStyles}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isSearchable={true}
                    isClearable={false}
                    // FIX: Only access document on client side
                    menuPortalTarget={mounted ? document.body : undefined}
                    menuPosition="fixed"
                  />
                  <small className="text-muted d-block mt-1">
                    Select the role assigned to you by admin
                  </small>
                </div>

                {/* Email */}
                <div className="mb-3 animate-fade-up delay-200">
                  <label className="form-label fw-semibold">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0 ps-0"
                      placeholder="staff@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="mb-3 animate-fade-up delay-300">
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
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4 animate-fade-up delay-400">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="rememberStaff"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label className="form-check-label text-secondary" htmlFor="rememberStaff">
                      Keep me logged in
                    </label>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none text-primary"
                    onClick={() => toast.info("Contact admin to reset password")}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn btn-dark w-100 py-2 rounded-pill fw-semibold animate-fade-up delay-500"
                  style={{ backgroundColor: "#0a2b4e", borderColor: "#0a2b4e" }}
                  disabled={loading || loadingRoles}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Verifying...
                    </>
                  ) : (
                    "Staff Sign In"
                  )}
                </button>
              </form>

              <div className="mt-4 text-center animate-fade-up delay-600">
                <button
                  onClick={() => router.back()}
                  className="btn btn-link text-secondary text-decoration-none p-0"
                >
                  ← Back to previous page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}