'use client';

import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './bulk.css';

export default function BulkImportPage() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDownload = (type) => {
    // In a real app, these would be actual file URLs from your backend
    if (type === 'skeleton') {
      // window.location.href = '/api/download/skeleton';
      toast.success('Skeleton file download started');
    } else if (type === 'example') {
      // window.location.href = '/api/download/example';
      toast.success('Example file download started');
    } else if (type === 'brands') {
      // window.location.href = '/api/download/brands-categories.pdf';
      toast.success('Downloading brands & categories PDF');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file first');
      return;
    }
    // Here you would upload the file to your backend
    toast.success('File uploaded successfully (demo)');
    setFile(null);
    e.target.reset();
  };

  return (
    <div className="bulk-import-page">
      <Toaster position="top-right" />
      <div className="container-fluid py-4">
        <div className="form-card">
          <div className="card-header">
            <h3 className="card-title mb-0">Bulk Import – Products</h3>
          </div>
          <div className="card-body">
            {/* Instructions */}
            <div className="instructions-box mb-4">
              <ul className="list-unstyled mb-0">
                <li><i className="bi bi-check-circle-fill text-success me-2"></i> Download the skeleton file and fill it with proper data.</li>
                <li><i className="bi bi-check-circle-fill text-success me-2"></i> You can download the example file to understand how the data must be filled.</li>
                <li><i className="bi bi-check-circle-fill text-success me-2"></i> Once you have downloaded and filled the skeleton file, upload it in the form below and submit.</li>
              </ul>
            </div>

            {/* Important Notes */}
            <div className="alert-note mb-4">
              <p className="mb-2"><strong>Important Notes:</strong></p>
              <ul className="mb-0">
                <li>Category and Brand should be in numerical id</li>
                <li>You can download the PDF to get Category and Brand ID</li>
              </ul>
            </div>

            {/* Download Buttons */}
            <div className="download-buttons mb-4">
              <button
                className="btn-outline-download me-3 mb-2"
                onClick={() => handleDownload('skeleton')}
              >
                <i className="bi bi-file-earmark-spreadsheet me-2"></i> Download Skeleton File
              </button>
              <button
                className="btn-outline-download me-3 mb-2"
                onClick={() => handleDownload('example')}
              >
                <i className="bi bi-file-earmark-text me-2"></i> Download Example File
              </button>
              <button
                className="btn-outline-download mb-2"
                onClick={() => handleDownload('brands')}
              >
                <i className="bi bi-filetype-pdf me-2"></i> Download Brand / Category PDF
              </button>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleSubmit}>
              <div className="upload-area">
                <label className="form-label fw-semibold">Upload Skeleton File</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    className="form-control"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="mt-2 text-muted small">
                  Accepted formats: .csv, .xlsx, .xls
                </div>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button type="submit" className="btn-save">
                  <i className="bi bi-upload me-2"></i> Upload & Import
                </button>
              </div>
            </form>
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