'use client';

import { useState } from 'react';
import './settings.css';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saveStatus, setSaveStatus] = useState('');
  
  // Profile Settings
  const [profile, setProfile] = useState({
    fullName: 'Alex Morgan',
    email: 'admin@superadmin.com',
    phone: '+1 234 567 890',
    role: 'Super Admin',
    avatar: 'AM'
  });
  
  // System Settings
  const [system, setSystem] = useState({
    appName: 'SuperAdmin Portal',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    language: 'English'
  });
  
  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailReports: false,
    pushOrders: true,
    pushPromotions: false,
    weeklyDigest: true
  });
  
  // Security Settings
  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: '30',
    loginAlerts: true
  });

  const handleSave = (section) => {
    setSaveStatus(`${section} settings saved!`);
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <div>
          <h1 className="page-title"><i className="bi bi-gear-fill"></i> Settings</h1>
          <p className="page-subtitle">Manage your application preferences and account settings.</p>
        </div>
        {saveStatus && <div className="save-toast">{saveStatus}</div>}
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <i className="bi bi-person-circle"></i> Profile
        </button>
        <button className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
          <i className="bi bi-display"></i> System
        </button>
        <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
          <i className="bi bi-bell"></i> Notifications
        </button>
        <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
          <i className="bi bi-shield-lock"></i> Security
        </button>
      </div>

      {/* Content Panels */}
      <div className="settings-content">
        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <div className="settings-card animate-fadein">
            <div className="card-header">
              <h3><i className="bi bi-person-badge"></i> Profile Information</h3>
              <span className="badge-modern">Admin Account</span>
            </div>
            <div className="card-body">
              <div className="avatar-section">
                <div className="avatar-preview">{profile.avatar}</div>
                <button className="btn-secondary-sm"><i className="bi bi-camera"></i> Change Avatar</button>
              </div>
              <div className="form-grid">
                <div className="form-group"><label>Full Name</label><input type="text" value={profile.fullName} onChange={(e) => setProfile({...profile, fullName: e.target.value})} /></div>
                <div className="form-group"><label>Email Address</label><input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} /></div>
                <div className="form-group"><label>Phone Number</label><input type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} /></div>
                <div className="form-group"><label>Role</label><input type="text" value={profile.role} disabled /></div>
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={() => handleSave('Profile')}>Save Changes</button>
                <button className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* System Settings */}
        {activeTab === 'system' && (
          <div className="settings-card animate-fadein">
            <div className="card-header">
              <h3><i className="bi bi-sliders2"></i> System Configuration</h3>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group"><label>Application Name</label><input type="text" value={system.appName} onChange={(e) => setSystem({...system, appName: e.target.value})} /></div>
                <div className="form-group"><label>Timezone</label><select value={system.timezone} onChange={(e) => setSystem({...system, timezone: e.target.value})}><option>Asia/Kolkata</option><option>America/New_York</option><option>Europe/London</option></select></div>
                <div className="form-group"><label>Date Format</label><select value={system.dateFormat} onChange={(e) => setSystem({...system, dateFormat: e.target.value})}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></div>
                <div className="form-group"><label>Default Language</label><select value={system.language} onChange={(e) => setSystem({...system, language: e.target.value})}><option>English</option><option>Hindi</option><option>Spanish</option></select></div>
              </div>
              <div className="form-actions"><button className="btn-primary" onClick={() => handleSave('System')}>Save Settings</button></div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="settings-card animate-fadein">
            <div className="card-header"><h3><i className="bi bi-envelope-paper"></i> Notification Preferences</h3></div>
            <div className="card-body">
              <div className="toggle-group"><div><strong>Email Notifications</strong><p>Receive order confirmations and reports via email</p></div><label className="switch"><input type="checkbox" checked={notifications.emailOrders} onChange={(e) => setNotifications({...notifications, emailOrders: e.target.checked})} /><span className="slider"></span></label></div>
              <div className="toggle-group"><div><strong>Weekly Reports</strong><p>Get a summary of platform performance every Monday</p></div><label className="switch"><input type="checkbox" checked={notifications.weeklyDigest} onChange={(e) => setNotifications({...notifications, weeklyDigest: e.target.checked})} /><span className="slider"></span></label></div>
              <div className="toggle-group"><div><strong>Push Notifications</strong><p>Real‑time alerts for new orders and updates</p></div><label className="switch"><input type="checkbox" checked={notifications.pushOrders} onChange={(e) => setNotifications({...notifications, pushOrders: e.target.checked})} /><span className="slider"></span></label></div>
              <div className="form-actions"><button className="btn-primary" onClick={() => handleSave('Notification')}>Save Preferences</button></div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="settings-card animate-fadein">
            <div className="card-header"><h3><i className="bi bi-shield-check"></i> Security & Access</h3></div>
            <div className="card-body">
              <div className="toggle-group"><div><strong>Two-Factor Authentication</strong><p>Add an extra layer of security to your account</p></div><label className="switch"><input type="checkbox" checked={security.twoFactor} onChange={(e) => setSecurity({...security, twoFactor: e.target.checked})} /><span className="slider"></span></label></div>
              <div className="toggle-group"><div><strong>Login Alerts</strong><p>Get notified when a new device logs in</p></div><label className="switch"><input type="checkbox" checked={security.loginAlerts} onChange={(e) => setSecurity({...security, loginAlerts: e.target.checked})} /><span className="slider"></span></label></div>
              <div className="form-group"><label>Session Timeout (minutes)</label><input type="number" value={security.sessionTimeout} onChange={(e) => setSecurity({...security, sessionTimeout: e.target.value})} min="5" max="120" /></div>
              <div className="form-actions"><button className="btn-primary" onClick={() => handleSave('Security')}>Update Security</button></div>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone (shown on all tabs) */}
      <div className="danger-zone">
        <h4><i className="bi bi-exclamation-triangle"></i> Danger Zone</h4>
        <p>Once you delete your account, there is no going back. Please be certain.</p>
        <button className="btn-danger" onClick={() => alert('Delete account demo')}>Delete Account</button>
      </div>
    </div>
  );
}