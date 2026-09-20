'use client';

import { useState, useEffect } from 'react';
import Select from 'react-select';
import SERVERURL from '@/app/services/serverURL';
import './delivery-boy-form.css';

const districtOptions = [
  { value: 'Thiruvananthapuram', label: 'Thiruvananthapuram' },
  { value: 'Kollam', label: 'Kollam' },
  { value: 'Pathanamthitta', label: 'Pathanamthitta' },
  { value: 'Alappuzha', label: 'Alappuzha' },
  { value: 'Kottayam', label: 'Kottayam' },
  { value: 'Idukki', label: 'Idukki' },
  { value: 'Ernakulam', label: 'Ernakulam' },
  { value: 'Thrissur', label: 'Thrissur' },
  { value: 'Palakkad', label: 'Palakkad' },
  { value: 'Malappuram', label: 'Malappuram' },
  { value: 'Kozhikode', label: 'Kozhikode' },
  { value: 'Wayanad', label: 'Wayanad' },
  { value: 'Kannur', label: 'Kannur' },
  { value: 'Kasaragod', label: 'Kasaragod' },
];

export default function DeliveryBoyForm({
  title,
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel = 'Save',
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    aadharNumber: '',
    licenseNumber: '',
    bikeNumber: '',
    district: '',
    status: 'active',
    aadharImage: null,
    licenseImage: null,
  });

  const [aadharPreview, setAadharPreview] = useState(null);
  const [licensePreview, setLicensePreview] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        password: '',
        aadharNumber: initialData.aadharNumber || '',
        licenseNumber: initialData.licenseNumber || '',
        bikeNumber: initialData.bikeNumber || '',
        district: initialData.district || '',
        status: initialData.status || 'active',
        aadharImage: null,
        licenseImage: null,
      });

      const baseUrl = SERVERURL;
      if (initialData.aadharImage) {
        setAadharPreview(`${baseUrl}/imgUploads/${initialData.aadharImage}`);
      } else {
        setAadharPreview(null);
      }
      if (initialData.licenseImage) {
        setLicensePreview(`${baseUrl}/imgUploads/${initialData.licenseImage}`);
      } else {
        setLicensePreview(null);
      }
    }
  }, [initialData]);

  useEffect(() => {
    return () => {
      if (aadharPreview?.startsWith('blob:')) URL.revokeObjectURL(aadharPreview);
      if (licensePreview?.startsWith('blob:')) URL.revokeObjectURL(licensePreview);
    };
  }, [aadharPreview, licensePreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (!file) return;
    setFormData(prev => ({ ...prev, [name]: file }));
    const url = URL.createObjectURL(file);
    if (name === 'aadharImage') {
      if (aadharPreview?.startsWith('blob:')) URL.revokeObjectURL(aadharPreview);
      setAadharPreview(url);
    } else {
      if (licensePreview?.startsWith('blob:')) URL.revokeObjectURL(licensePreview);
      setLicensePreview(url);
    }
  };

  const handleDistrictChange = (option) => {
    setFormData(prev => ({ ...prev, district: option ? option.value : '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onSubmit === 'function') {
      onSubmit(formData);
    } else {
      console.error('❌ onSubmit is not a function');
    }
  };

  const selectedDistrict = districtOptions.find(opt => opt.value === formData.district);

  return (
    <div className="delivery-boy-form-wrapper">
      <div className="form-card">
        <div className="form-header">
          <h2>{title}</h2>
        </div>
        <form onSubmit={handleSubmit} className="form-body">
          <div className="form-grid">
            {/* Left Column */}
            <div className="form-column">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Rajesh Kumar"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password {!initialData && '*'}</label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={initialData ? 'Leave blank to keep unchanged' : 'Enter password'}
                  required={!initialData}
                />
                {initialData && (
                  <small className="text-muted">Leave blank to keep current password</small>
                )}
              </div>

              <div className="form-group">
                <label>Aadhar Number *</label>
                <input
                  type="text"
                  name="aadharNumber"
                  className="form-control"
                  value={formData.aadharNumber}
                  onChange={handleChange}
                  placeholder="1234 1234 1234"
                  required
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="form-column">
              <div className="form-group">
                <label>License Number *</label>
                <input
                  type="text"
                  name="licenseNumber"
                  className="form-control"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  placeholder="KL123456"
                  required
                />
              </div>

              <div className="form-group">
                <label>Bike Number *</label>
                <input
                  type="text"
                  name="bikeNumber"
                  className="form-control"
                  value={formData.bikeNumber}
                  onChange={handleChange}
                  placeholder="KL07AB1234"
                  required
                />
              </div>

              <div className="form-group">
                <label>District *</label>
                <Select
                  options={districtOptions}
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  placeholder="Select district"
                  isClearable={false}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  required
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  className="form-control"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
          </div>

          {/* Image Uploads Section */}
          <div className="image-uploads">
            <div className="image-group">
              <label>Aadhar Image</label>
              {aadharPreview && (
                <div className="preview-wrapper">
                  <img
                    src={aadharPreview}
                    alt="Aadhar"
                    className="preview-thumb"
                    onClick={() => aadharPreview && window.open(aadharPreview, '_blank')}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                name="aadharImage"
                className="file-input"
                onChange={handleFileChange}
                id="aadharImage"
              />
              <label htmlFor="aadharImage" className="file-label">
                Choose File
              </label>
            </div>

            <div className="image-group">
              <label>License Image</label>
              {licensePreview && (
                <div className="preview-wrapper">
                  <img
                    src={licensePreview}
                    alt="License"
                    className="preview-thumb"
                    onClick={() => licensePreview && window.open(licensePreview, '_blank')}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                name="licenseImage"
                className="file-input"
                onChange={handleFileChange}
                id="licenseImage"
              />
              <label htmlFor="licenseImage" className="file-label">
                Choose File
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => window.history.back()}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>{submitLabel}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}