'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api';
import toast, { Toaster } from 'react-hot-toast';
import { createStoreAPI } from '../../../services/storeManagementAPI';

import './storeAdd.css';

const mapContainerStyle = { width: '100%', height: '300px', borderRadius: '8px' };
const defaultCenter = { lat: 10.1187, lng: 76.4864 };

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

const libraries = ['places'];

export default function AddStorePage() {
  const router = useRouter();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [formData, setFormData] = useState({
    storeName: '',
    shopid: '',
    searchLocation: '',
    address: '',
    latitude: defaultCenter.lat,
    longitude: defaultCenter.lng,
    district: '',
    status: 'pending',
    vendorCategory: '',
    pincode: '',
    emailAddress: '',
    password: '',
    drugLicenseNumber: '',
    gstNumber: '',
    contactNumber: '',
    pharmacistName: '',
  });

  const [thumbnailFiles, setThumbnailFiles] = useState([]);
  const [thumbnailPreviews, setThumbnailPreviews] = useState([]);
  const [map, setMap] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [shopsList, setShopsList] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const searchBoxRef = useRef(null);

  // Fetch shops
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await fetch('/api/medisoft/shops');
        if (res.ok) {
          const data = await res.json();
          setShopsList(Array.isArray(data) ? data : []);
        }
      } catch (_) {}
    };
    fetchShops();
  }, []);

  // ---------- District Detection (with detailed logs) ----------
  const fetchDistrictFromCoords = useCallback(async (lat, lng) => {
    console.log('📍 fetchDistrictFromCoords called with lat:', lat, 'lng:', lng);
    if (!apiKey) {
      console.warn('❌ API key missing');
      return;
    }
    setIsGeocoding(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      console.log('🌐 Geocoding URL:', url);
      const res = await fetch(url);
      const data = await res.json();

      console.log('📦 Geocoding response status:', data.status);
      console.log('📦 Full Geocoding response:', JSON.stringify(data, null, 2));

      if (data.status === 'OK' && data.results.length > 0) {
        const components = data.results[0].address_components;
        console.log('📍 Address components:', components);
        let district = '';

        // 1. Check administrative_area_level_3 (DISTRICT in India)
        for (const c of components) {
          console.log(`🔍 Checking component: ${c.long_name}, types:`, c.types);
          if (c.types.includes('administrative_area_level_3')) {
            district = c.long_name;
            console.log('✅ Found district (admin level 3):', district);
            break;
          }
        }

        // 2. Check administrative_area_level_2 (DIVISION – fallback)
        if (!district) {
          for (const c of components) {
            if (c.types.includes('administrative_area_level_2')) {
              district = c.long_name;
              console.log('✅ Found district (admin level 2):', district);
              break;
            }
          }
        }

        // 3. Check locality
        if (!district) {
          for (const c of components) {
            if (c.types.includes('locality')) {
              district = c.long_name;
              console.log('✅ Found district (locality):', district);
              break;
            }
          }
        }

        // 4. Fallback to administrative_area_level_1 (state)
        if (!district) {
          for (const c of components) {
            if (c.types.includes('administrative_area_level_1')) {
              district = c.long_name;
              console.log('✅ Found district (state):', district);
              break;
            }
          }
        }

        console.log('🏷️ Final district detected:', district || 'none');
        setFormData(prev => ({ ...prev, district }));
        if (district) toast.success(`District: ${district}`);
        else toast.warn('Could not determine district. You can type it manually.');
      } else {
        setFormData(prev => ({ ...prev, district: '' }));
        console.warn('⚠️ Geocoding failed:', data.status);
        if (data.status === 'REQUEST_DENIED') toast.error('Geocoding API not enabled or key invalid.');
        else if (data.status === 'ZERO_RESULTS') toast.error('No address found.');
        else if (data.status === 'OVER_QUERY_LIMIT') toast.error('Quota exceeded.');
        else toast.error('Reverse geocoding failed.');
      }
    } catch (error) {
      console.error('🔥 Geocoding error:', error);
      setFormData(prev => ({ ...prev, district: '' }));
      toast.error('Network error fetching district.');
    } finally {
      setIsGeocoding(false);
    }
  }, [apiKey]);

  const updatePosition = useCallback((lat, lng) => {
    console.log('🔄 Updating position to:', lat, lng);
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    if (map) map.panTo({ lat, lng });
    if (lat && lng) fetchDistrictFromCoords(lat, lng);
  }, [map, fetchDistrictFromCoords]);

  // ---------- Map handlers ----------
  const onMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    console.log('🖱️ Map clicked at:', lat, lng);
    updatePosition(lat, lng);
  }, [updatePosition]);

  const onMarkerDragEnd = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    console.log('🔹 Dragged marker to:', lat, lng);
    updatePosition(lat, lng);
  }, [updatePosition]);

  const onLoadAutocomplete = useCallback((instance) => {
    setAutocomplete(instance);
    instance.setComponentRestrictions({ country: 'in' });
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    console.log('📍 Place selected:', place);
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address || place.name || '';
      const searchLocation = searchBoxRef.current?.value || address;

      setFormData(prev => ({
        ...prev,
        address,
        latitude: lat,
        longitude: lng,
        searchLocation,
      }));
      if (map) { map.panTo({ lat, lng }); map.setZoom(15); }
      fetchDistrictFromCoords(lat, lng);
    } else {
      toast.error('Could not find coordinates. Try a more specific location.');
    }
  }, [autocomplete, map, fetchDistrictFromCoords]);

  // ---------- Thumbnails ----------
  const handleThumbnailChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Maximum 5 thumbnails allowed');
      return;
    }
    setThumbnailFiles(files);
    const previews = files.map(f => URL.createObjectURL(f));
    thumbnailPreviews.forEach(u => URL.revokeObjectURL(u));
    setThumbnailPreviews(previews);
  }, [thumbnailPreviews]);

  useEffect(() => () => thumbnailPreviews.forEach(u => URL.revokeObjectURL(u)), [thumbnailPreviews]);

  // ---------- Validation & Save ----------
  const validateForm = useCallback(() => {
    const required = ['storeName', 'vendorCategory', 'pincode', 'emailAddress',
      'password', 'drugLicenseNumber', 'gstNumber', 'contactNumber',
      'pharmacistName', 'address', 'searchLocation'];
    for (const f of required) {
      if (!formData[f]?.trim()) {
        toast.error(`${f.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} is required`);
        return false;
      }
    }
    if (!/^\d{6}$/.test(formData.pincode)) {
      toast.error('Pincode must be exactly 6 digits');
      return false;
    }
    if (!/^\d{10}$/.test(formData.contactNumber)) {
      toast.error('Contact number must be 10 digits');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
      toast.error('Valid email required');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (thumbnailFiles.length === 0) {
      toast.error('At least one thumbnail is required');
      return false;
    }
    return true;
  }, [formData, thumbnailFiles]);

  const saveStore = useCallback(async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = new FormData();
      Object.keys(formData).forEach(k => {
        if (formData[k] !== undefined && formData[k] !== null) payload.append(k, formData[k]);
      });
      thumbnailFiles.forEach(f => payload.append('thumbnailImages', f));
      const resp = await createStoreAPI(payload);
      if (resp.success) {
        toast.success('Store added successfully');
        router.push('/super-admin/store-managment');
      } else {
        toast.error(resp.message || 'Creation failed');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    } finally {
      setSaving(false);
    }
  }, [formData, thumbnailFiles, validateForm, router]);

  // ---------- Map load callbacks ----------
  const handleMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    setMapLoaded(true);
    setMapLoadError(false);
  }, []);

  const handleMapError = useCallback((error) => {
    console.error('Google Maps load error:', error);
    setMapLoadError(true);
    toast.error('Google Maps failed to load. Check console.');
  }, []);

  const mapComponent = useMemo(() => (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={{ lat: formData.latitude, lng: formData.longitude }}
      zoom={14}
      options={mapOptions}
      onClick={onMapClick}
      onLoad={handleMapLoad}
    >
      <Marker
        position={{ lat: formData.latitude, lng: formData.longitude }}
        draggable
        onDragEnd={onMarkerDragEnd}
      />
    </GoogleMap>
  ), [formData.latitude, formData.longitude, onMapClick, onMarkerDragEnd, handleMapLoad]);

  if (!apiKey) {
    return (
      <div className="medical-stores-container">
        <div className="alert alert-danger">
          <strong>Missing API Key:</strong> Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local
        </div>
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={libraries}
      onError={handleMapError}
    >
      <Toaster position="top-right" />
      <div className="medical-stores-container">
        <div className="stores-hero">
          <div>
            <h1 className="stores-title">Add New Medical Store</h1>
            <p className="stores-subtitle">All fields are mandatory</p>
          </div>
          <button className="btn-secondary" onClick={() => router.back()}>
            <i className="bi bi-arrow-left"></i> Back
          </button>
        </div>

        <div className="store-form-card">
          <div className="form-section">
            {/* Store Name */}
            <div className="form-group">
              <label>Store Name *</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                placeholder="e.g., City Medical Hall"
              />
            </div>

            {/* Medisoft Shop ID */}
            <div className="form-group">
              <label>Medisoft Shop ID (optional)</label>
              <input
                type="text"
                value={formData.shopid}
                onChange={(e) => setFormData({ ...formData, shopid: e.target.value })}
                placeholder="e.g., 30, 3743, 3783, 3752"
              />
              <small className="text-muted">If provided, it will be validated.</small>
            </div>

            {/* Search Location */}
            <div className="form-group">
              <label>Search for location *</label>
              <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
                <input
                  type="text"
                  ref={searchBoxRef}
                  placeholder="e.g., Ernakulam, Marine Drive, Kochi"
                  className="form-control"
                  onChange={(e) => setFormData(prev => ({ ...prev, searchLocation: e.target.value }))}
                  value={formData.searchLocation}
                />
              </Autocomplete>
            </div>

            {/* Map Section */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Exact Location * (click or drag marker)</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <div style={mapContainerStyle}>
                  {mapComponent}
                </div>

                {!mapLoaded && !mapLoadError && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.7)',
                    borderRadius: '8px',
                    pointerEvents: 'none',
                  }}>
                    <span>Loading map…</span>
                  </div>
                )}

                {mapLoadError && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                  }}>
                    <p><strong>⚠️ Google Maps failed to load.</strong></p>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>Check browser console (F12) for details.</p>
                    <button className="btn-secondary" onClick={() => window.location.reload()}>
                      Refresh Page
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Lat/Lng */}
            <div className="latlng-inputs">
              <div className="lat-input">
                <label>Latitude *</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => updatePosition(parseFloat(e.target.value), formData.longitude)}
                />
              </div>
              <div className="lng-input">
                <label>Longitude *</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => updatePosition(formData.latitude, parseFloat(e.target.value))}
                />
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label>Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street, city, etc."
              />
            </div>

            {/* District */}
            <div className="form-group">
              <label>District (auto‑detected)</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="Will be detected from location"
                disabled={isGeocoding}
                className={isGeocoding ? 'text-muted' : ''}
              />
              {isGeocoding && <small className="text-info">Detecting district…</small>}
              <small className="text-muted">You can manually correct if needed.</small>
            </div>

            {/* Vendor Category */}
            <div className="form-group">
              <label>Vendor Category *</label>
              <select
                value={formData.vendorCategory}
                onChange={(e) => setFormData({ ...formData, vendorCategory: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="medical store">Medical Store</option>
                <option value="Lab test">Lab Test</option>
                <option value="Ayurveda store">Ayurveda Store</option>
              </select>
            </div>

            {/* Pincode */}
            <div className="form-group">
              <label>Pincode *</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="6-digit pincode"
                maxLength="6"
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                value={formData.emailAddress}
                onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                placeholder="store@example.com"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label>Password * (at least 6 characters)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
            </div>

            {/* Drug License */}
            <div className="form-group">
              <label>Drug License Number *</label>
              <input
                type="text"
                value={formData.drugLicenseNumber}
                onChange={(e) => setFormData({ ...formData, drugLicenseNumber: e.target.value })}
                placeholder="e.g., DL-12345"
              />
            </div>

            {/* GST */}
            <div className="form-group">
              <label>GST Number *</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                placeholder="22AAAAA0000A1Z"
              />
            </div>

            {/* Contact */}
            <div className="form-group">
              <label>Contact Number * (10 digits)</label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="10-digit mobile number"
                maxLength="10"
              />
            </div>

            {/* Pharmacist */}
            <div className="form-group">
              <label>Pharmacist Name *</label>
              <input
                type="text"
                value={formData.pharmacistName}
                onChange={(e) => setFormData({ ...formData, pharmacistName: e.target.value })}
                placeholder="Full name of responsible pharmacist"
              />
            </div>

            {/* Thumbnails */}
            <div className="form-group">
              <label>Thumbnail Images * (max 5)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleThumbnailChange}
              />
              {thumbnailPreviews.length > 0 && (
                <div className="thumbnail-preview-grid">
                  {thumbnailPreviews.map((src, idx) => (
                    <img key={idx} src={src} alt={`preview-${idx}`} className="thumbnail-preview-img" />
                  ))}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="form-group">
              <label>Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => router.back()}>Cancel</button>
              <button className="btn-primary" onClick={saveStore} disabled={saving}>
                {saving ? 'Saving...' : 'Add Store'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </LoadScript>
  );
}