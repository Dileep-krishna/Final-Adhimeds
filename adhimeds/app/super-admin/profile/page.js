"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import "./profile.css";
import {
  getCurrentAdminAPI,
  updateAdminProfileAPI,
  deleteAvatarAPI,
} from "@/app/services/adminLoginAPI";

export default function AdminProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Profile state ──
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Super Admin",
    avatar: null,
    joinedAt: "",
  });

  // ── Password change state ──
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ── Avatar upload state ──
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // ── Helper: build absolute avatar URL ──
  const buildAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    // If it's already an absolute URL, return as is
    if (avatarPath.startsWith("http")) return avatarPath;

    // ✅ FIX: prepend the static folder '/imgUploads/' if not already present
    let normalizedPath = avatarPath;
    if (!avatarPath.startsWith("/imgUploads/")) {
      normalizedPath = `/imgUploads/${avatarPath}`;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";
    return `${baseUrl}${normalizedPath}`;
  };

  // ── Fetch profile ──
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    console.log("🔍 [fetchProfile] Starting...");
    try {
      const res = await getCurrentAdminAPI();
      console.log("📦 [fetchProfile] API response:", res);

      if (res.success) {
        const data = res.data;
        console.log("👤 [fetchProfile] Raw avatar from DB:", data.avatar);

        // Build the absolute URL for the avatar
        const avatarUrl = buildAvatarUrl(data.avatar);
        console.log("🖼️ [fetchProfile] Final avatar URL:", avatarUrl);

        setProfile({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          role: data.role || "Super Admin",
          avatar: avatarUrl,
          joinedAt: data.createdAt || "",
        });
        setAvatarPreview(avatarUrl);
        console.log("✅ [fetchProfile] Profile state updated.");
      } else {
        toast.error(res.message || "Failed to load profile");
        console.warn("⚠️ [fetchProfile] API returned success=false:", res.message);
      }
    } catch (err) {
      console.error("❌ [fetchProfile] Error:", err);
      toast.error("Server error while loading profile");
    } finally {
      setLoading(false);
      console.log("🏁 [fetchProfile] Finished.");
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Handlers ──
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("📁 [handleAvatarChange] File selected:", file.name);
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
      console.log("🖼️ [handleAvatarChange] Local preview URL:", objectUrl);
    }
  };

  // ── Save profile ──
  const handleSave = async () => {
    console.log("💾 [handleSave] Save button clicked.");
    if (!profile.name.trim()) {
      toast.error("Name is required");
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = passwordData;
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        toast.error("Current password is required to change password");
        return;
      }
      if (newPassword.length < 6) {
        toast.error("New password must be at least 6 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("phone", profile.phone || "");
      if (currentPassword && newPassword) {
        formData.append("currentPassword", currentPassword);
        formData.append("newPassword", newPassword);
      }
      if (avatarFile) {
        formData.append("avatar", avatarFile);
        console.log("📤 [handleSave] Avatar file attached:", avatarFile.name);
      } else {
        console.log("ℹ️ [handleSave] No new avatar file to upload.");
      }

      const res = await updateAdminProfileAPI(formData);
      console.log("📦 [handleSave] Update API response:", res);

      if (res.success) {
        toast.success("Profile updated successfully");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        // Re-fetch to get updated data (including new avatar URL from server)
        await fetchProfile();
        console.log("🔄 [handleSave] Profile re-fetched after update.");
      } else {
        toast.error(res.message || "Update failed");
        console.warn("⚠️ [handleSave] Update failed:", res.message);
      }
    } catch (err) {
      console.error("❌ [handleSave] Error:", err);
      toast.error("Server error while updating profile");
    } finally {
      setSaving(false);
      console.log("🏁 [handleSave] Finished.");
    }
  };

  // ── Delete avatar ──
  const handleDeleteAvatar = async () => {
    if (!profile.avatar) {
      toast.error("No avatar to delete");
      return;
    }
    if (!confirm("Remove your profile picture?")) return;

    console.log("🗑️ [handleDeleteAvatar] Deleting avatar...");
    try {
      const res = await deleteAvatarAPI();
      console.log("📦 [handleDeleteAvatar] Delete API response:", res);

      if (res.success) {
        toast.success("Avatar removed");
        setAvatarPreview(null);
        setAvatarFile(null);
        await fetchProfile(); // refresh profile (avatar will be null)
        console.log("🔄 [handleDeleteAvatar] Profile re-fetched after deletion.");
      } else {
        toast.error(res.message || "Failed to delete avatar");
        console.warn("⚠️ [handleDeleteAvatar] Delete failed:", res.message);
      }
    } catch (err) {
      console.error("❌ [handleDeleteAvatar] Error:", err);
      toast.error("Server error");
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Toaster position="top-right" />

      <div className="profile-header">
        <div>
          <h1 className="profile-title">My Profile</h1>
          <p className="profile-subtitle">Manage your personal information</p>
        </div>
        <button className="btn-secondary" onClick={() => router.push("/super-admin/dashboard")}>
          <i className="bi bi-arrow-left"></i> Back to Dashboard
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper" onClick={handleAvatarClick}>
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile"
                className="profile-avatar"
                onError={(e) => {
                  console.error("🖼️ [img] Failed to load image:", avatarPreview);
                  e.target.style.display = "none"; // optional fallback
                }}
                onLoad={() => console.log("✅ [img] Image loaded:", avatarPreview)}
              />
            ) : (
              <div className="profile-avatar-placeholder">
                <i className="bi bi-person-fill"></i>
              </div>
            )}
            <div className="profile-avatar-overlay">
              <i className="bi bi-camera"></i>
              <span>Change</span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
          </div>
          <div className="profile-role-badge">{profile.role}</div>
          {profile.avatar && (
            <button
              className="btn-remove-avatar"
              onClick={handleDeleteAvatar}
              title="Remove avatar"
            >
              <i className="bi bi-x-circle"></i> Remove
            </button>
          )}
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              placeholder="Your full name"
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              disabled
              className="disabled-input"
            />
            <small className="text-muted">Email cannot be changed</small>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={profile.phone}
              onChange={handleProfileChange}
              placeholder="10-digit phone number"
              maxLength="10"
            />
          </div>

          <div className="form-group">
            <label>Joined On</label>
            <input
              type="text"
              value={profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : "N/A"}
              disabled
              className="disabled-input"
            />
          </div>

          <hr className="profile-divider" />

          <h4 className="password-section-title">Change Password</h4>

          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Enter current password"
            />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              placeholder="Enter new password (min 6 chars)"
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Confirm new password"
            />
          </div>

          <div className="form-actions">
            <button className="btn-cancel" onClick={() => router.push("/super-admin/dashboard")}>
              Cancel
            </button>
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg"></i> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}