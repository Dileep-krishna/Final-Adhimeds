'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import './brand-bulk-import.css';
import { bulkExportBrandsAPI, bulkImportBrandsAPI } from '@/app/services/brandAPI';

export default function BulkImport() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef(null);

  // ─── Handle file selection ───
  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  }, []);

  // ─── Download skeleton CSV ───
  const downloadSkeleton = useCallback(() => {
    const headers = ['name', 'logo', 'category', 'metaTitle', 'metaDescription', 'metaKeywords'];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brand_skeleton.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Skeleton file downloaded');
  }, []);

  // ─── Download example CSV ───
  const downloadExample = useCallback(() => {
    const headers = ['name', 'logo', 'category', 'metaTitle', 'metaDescription', 'metaKeywords'];
    const rows = [
      ['Nike', 'nike-logo.png', 'Sports', 'Nike Official Brand', 'Best sports brand', 'sports, shoes, apparel'],
      ['Adidas', 'adidas-logo.png', 'Sports', 'Adidas Originals', 'German sportswear', 'sports, shoes, fashion'],
      ['Puma', 'puma-logo.png', 'Sports', 'Puma Sports', 'Athletic footwear', 'sports, running, shoes'],
    ];
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brand_example.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Example file downloaded');
  }, []);

  // ─── Upload ───
  const handleSubmit = useCallback(async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    try {
      const result = await bulkImportBrandsAPI(file);
      const { message, imported, errors } = result;
      if (imported > 0) {
        toast.success(`✅ ${message}`);
        if (errors && errors.length > 0) {
          console.warn('Import errors:', errors);
          toast.error(`⚠️ ${errors.length} rows had errors (see console)`);
        }
        setFile(null);
        setFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        router.push('/super-admin/product-managment/product-setup/Brand');
      } else {
        toast.error('No brands were imported. Check the file format.');
        if (errors && errors.length > 0) {
          console.error('Import errors:', errors);
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.message || 'Import failed');
    } finally {
      setIsUploading(false);
    }
  }, [file, router]);

  // ─── Bulk Export ──────────────────────────────────────
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await bulkExportBrandsAPI();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'brands_export.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Export completed');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="container mt-4">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {/* Page Title */}
      <div className="page-header">
        <h4>Brand Bulk Upload</h4>
        <p className="text-muted">Upload brands in bulk using CSV file</p>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => router.push('/super-admin/product-managment/product-setup/Brand')}
        >
          ← Back to Brands
        </button>
      </div>

      <div className="card main-card">
        {/* Step 1 Instructions */}
        <div className="steps-section">
          <h6><strong>Step 1:</strong></h6>
          <ol>
            <li>Download the skeleton file and fill it with proper data.</li>
            <li>You can download the example file to understand how the data must be filled.</li>
            <li>Once you have downloaded and filled the skeleton file, upload it in the form below and submit.</li>
          </ol>
        </div>

        {/* Download Buttons */}
        <div className="download-buttons">
          <button className="btn btn-outline-primary me-3" onClick={downloadSkeleton}>
            <i className="bi bi-download"></i> Download CSV
          </button>
          <button className="btn btn-outline-secondary" onClick={downloadExample}>
            <i className="bi bi-file-earmark-text"></i> Download Example
          </button>
        </div>

        <hr />

        {/* Upload Section */}
        <div className="upload-section">
          <h6>Upload Brand File</h6>
          <div className="file-upload-box">
            <input
              type="file"
              id="brandFile"
              accept=".csv, .xlsx"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <label htmlFor="brandFile" className="file-label">
              <i className="bi bi-cloud-upload"></i> Choose File
            </label>
            {fileName && <span className="ms-3 text-success">{fileName}</span>}
            <p className="text-muted mt-2 small">Supported formats: .csv, .xlsx</p>
          </div>
          <button
            className="btn btn-primary mt-3"
            onClick={handleSubmit}
            disabled={!file || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </div>

        {/* ─── Bulk Export Section ─── */}
        <div className="export-section mt-4 pt-3 border-top">
          <h6>Bulk Export</h6>
          <p className="text-muted">Download your brand database in Excel format.</p>
          <button
            className="btn btn-success"
            onClick={handleExport}
            disabled={isExporting}
          >
            <i className="bi bi-download me-2"></i>
            {isExporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>

        <div className="footer-note text-center mt-4">
          <small className="text-muted">© Active eCommerce CMS v11.0.0</small>
        </div>
      </div>
    </div>
  );
}