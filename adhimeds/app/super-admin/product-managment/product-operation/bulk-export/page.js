'use client';

import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './bulk-export.css';

export default function BulkExportPage() {
  const [exportType, setExportType] = useState('products');
  const [fileFormat, setFileFormat] = useState('csv');
  const [selectedFields, setSelectedFields] = useState({
    id: true,
    name: true,
    price: true,
    stock: true,
    category: true,
    brand: true,
    description: false,
    images: false,
  });

  const exportOptions = [
    { value: 'products', label: 'Products' },
    { value: 'categories', label: 'Categories' },
    { value: 'brands', label: 'Brands' },
    { value: 'orders', label: 'Orders' },
    { value: 'customers', label: 'Customers' },
  ];

  const productFields = [
    { key: 'id', label: 'Product ID' },
    { key: 'name', label: 'Product Name' },
    { key: 'price', label: 'Price' },
    { key: 'stock', label: 'Stock Quantity' },
    { key: 'category', label: 'Category' },
    { key: 'brand', label: 'Brand' },
    { key: 'description', label: 'Description' },
    { key: 'images', label: 'Images URLs' },
  ];

  const handleFieldToggle = (fieldKey) => {
    setSelectedFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  const handleExport = async () => {
    // Build query params
    const params = new URLSearchParams();
    params.append('type', exportType);
    params.append('format', fileFormat);
    Object.entries(selectedFields).forEach(([key, value]) => {
      if (value) params.append('fields[]', key);
    });

    try {
      toast.loading('Preparing export...', { id: 'export' });
      const response = await fetch(`/api/export?${params.toString()}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportType}_export.${fileFormat === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export completed', { id: 'export' });
    } catch (error) {
      console.error(error);
      toast.error('Export failed. Please try again.', { id: 'export' });
    }
  };

  return (
    <div className="bulk-export-page">
      <Toaster position="top-right" />
      <div className="container-fluid py-4">
        <div className="form-card">
          <div className="card-header">
            <h3 className="card-title mb-0">Bulk Export</h3>
          </div>
          <div className="card-body">
            {/* Instructions */}
            <div className="instructions-box mb-4">
              <ul className="list-unstyled mb-0">
                <li><i className="bi bi-info-circle-fill text-primary me-2"></i> Select the data type you want to export.</li>
                <li><i className="bi bi-info-circle-fill text-primary me-2"></i> Choose the file format (CSV or Excel).</li>
                <li><i className="bi bi-info-circle-fill text-primary me-2"></i> Select the fields you wish to include in the export file.</li>
              </ul>
            </div>

            {/* Export Type */}
            <div className="form-group mb-4">
              <label className="form-label fw-semibold">Export Type</label>
              <select
                className="form-select"
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
              >
                {exportOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* File Format */}
            <div className="form-group mb-4">
              <label className="form-label fw-semibold">File Format</label>
              <div className="d-flex gap-3">
                <button
                  type="button"
                  className={`format-btn ${fileFormat === 'csv' ? 'active' : ''}`}
                  onClick={() => setFileFormat('csv')}
                >
                  CSV
                </button>
                <button
                  type="button"
                  className={`format-btn ${fileFormat === 'excel' ? 'active' : ''}`}
                  onClick={() => setFileFormat('excel')}
                >
                  Excel (.xlsx)
                </button>
              </div>
            </div>

            {/* Field Selection (only for products) */}
            {exportType === 'products' && (
              <div className="field-selection mb-4">
                <label className="form-label fw-semibold mb-2">Select Fields to Export</label>
                <div className="field-grid">
                  {productFields.map(field => (
                    <label key={field.key} className="field-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedFields[field.key]}
                        onChange={() => handleFieldToggle(field.key)}
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>
                <div className="form-text text-muted mt-2">
                  Only selected fields will be included in the export file.
                </div>
              </div>
            )}

            {/* Note for other types */}
            {exportType !== 'products' && (
              <div className="alert-note mb-4">
                <i className="bi bi-info-circle me-2"></i>
                For {exportType}, all relevant fields will be exported.
              </div>
            )}

            {/* Export Button */}
            <div className="d-flex justify-content-end mt-4">
              <button className="btn-export" onClick={handleExport}>
                <i className="bi bi-download me-2"></i> Export Now
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-muted small">
          Active eCommerce CMS v11.0.0
        </div>
      </div>
    </div>
  );
}