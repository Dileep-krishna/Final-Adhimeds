'use client';

import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './smart.css';

export default function SmartBarPage() {
  const [showSmartBar, setShowSmartBar] = useState(true);
  const [backgroundDesign, setBackgroundDesign] = useState('plain');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [textColorTheme, setTextColorTheme] = useState('dark');
  const [buttonColor, setButtonColor] = useState('#0080ff');
  const [buttonTextColorTheme, setButtonTextColorTheme] = useState('light');

  const handleSave = () => {
    const config = {
      showSmartBar,
      backgroundDesign,
      backgroundColor,
      textColorTheme,
      buttonColor,
      buttonTextColorTheme,
    };
    console.log('Saving smart bar config:', config);
    toast.success('Smart Bar settings saved successfully');
    // Here you would call an API to save the configuration
  };

  return (
    <div className="smart-bar-page">
      <Toaster position="top-right" />
      <div className="container-fluid py-4">
        <div className="form-card">
          <div className="card-header">
            <h3 className="card-title mb-0">Smart Bar</h3>
          </div>
          <div className="card-body">
            {/* Show Smart Bar Toggle */}
            <div className="toggle-section mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <label className="toggle-label fw-semibold">Show Smart Bar</label>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={showSmartBar}
                    onChange={(e) => setShowSmartBar(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </div>
              <p className="text-muted small mt-2">
                (This bar will show a product summary at the bottom of the product detail page while scrolling.)
              </p>
            </div>

            {/* Background Design */}
            <div className="mb-4">
              <label className="form-label fw-semibold mb-2">Select Background Design</label>
              <div className="d-flex gap-3">
                <button
                  type="button"
                  className={`design-btn ${backgroundDesign === 'plain' ? 'active' : ''}`}
                  onClick={() => setBackgroundDesign('plain')}
                >
                  Plain
                </button>
                <button
                  type="button"
                  className={`design-btn ${backgroundDesign === 'blur' ? 'active' : ''}`}
                  onClick={() => setBackgroundDesign('blur')}
                >
                  Blur
                </button>
              </div>
            </div>

            {/* Background Color */}
            <div className="mb-4">
              <label className="form-label fw-semibold mb-2">Select Background Color</label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  className="color-picker"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                />
                <span className="color-value">{backgroundColor}</span>
              </div>
            </div>

            {/* Text Color (Light/Dark) */}
            <div className="mb-4">
              <label className="form-label fw-semibold mb-2">Select Text Color</label>
              <div className="d-flex gap-3">
                <button
                  type="button"
                  className={`theme-btn ${textColorTheme === 'light' ? 'active' : ''}`}
                  onClick={() => setTextColorTheme('light')}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={`theme-btn ${textColorTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTextColorTheme('dark')}
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Button Color */}
            <div className="mb-4">
              <label className="form-label fw-semibold mb-2">Select Button Color</label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  className="color-picker"
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                />
                <span className="color-value">{buttonColor}</span>
              </div>
            </div>

            {/* Button Text Color (Light/Dark) */}
            <div className="mb-4">
              <label className="form-label fw-semibold mb-2">Select Button Text Color</label>
              <div className="d-flex gap-3">
                <button
                  type="button"
                  className={`theme-btn ${buttonTextColorTheme === 'light' ? 'active' : ''}`}
                  onClick={() => setButtonTextColorTheme('light')}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={`theme-btn ${buttonTextColorTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => setButtonTextColorTheme('dark')}
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="d-flex justify-content-end mt-4">
              <button className="btn-save" onClick={handleSave}>
                <i className="bi bi-save me-2"></i> Save
              </button>
            </div>
          </div>
        </div>

     
      </div>
    </div>
  );
}