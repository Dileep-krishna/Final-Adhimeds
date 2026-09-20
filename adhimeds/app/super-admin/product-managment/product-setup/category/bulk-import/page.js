"use client";

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  bulkImportCategoriesAPI,
  bulkExportCategoriesAPI,
  downloadTemplateAPI,
} from "@/app/services/categoryAPI";
import "./bulk-import.css";

export default function BulkImportPage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const fileInputRef = useRef(null);

  // ─── Download Template ──────────────────────────────
  const downloadTemplate = useCallback(async () => {
    setIsDownloadingTemplate(true);
    try {
      const blob = await downloadTemplateAPI();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "category_reference_data.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to download template");
    } finally {
      setIsDownloadingTemplate(false);
    }
  }, []);

  // ─── Upload File ─────────────────────────────────────
  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    try {
      const result = await bulkImportCategoriesAPI(file);
      toast.success(result.message || "Categories imported successfully");
      setFile(null);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.push("/super-admin/product-managment/product-setup/category");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Import failed");
    } finally {
      setIsUploading(false);
    }
  }, [file, router]);

  // ─── Bulk Export ─────────────────────────────────────
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await bulkExportCategoriesAPI();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "categories_export.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export completed");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="category-page">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <div className="category-card">
        <div className="card-header">
          <h3>Category Bulk Upload</h3>
          <button
            className="btn-back"
            onClick={() => router.push("/super-admin/product-managment/product-setup/category")}
          >
            ← Back
          </button>
        </div>

        <div className="import-content">
          {/* ─── Instructions ─── */}
          <div className="instructions">
            <ol>
              <li>Download the skeleton file and fill it with proper data.</li>
              <li>You can download the example file to understand how the data must be filled.</li>
              <li>
                Parent Category and Attribute should be in numerical id. The file includes separate sheets for Category, Attribute.
              </li>
              <li>You can find all ids in the separate sheets inside the downloaded file.</li>
              <li>Once you have downloaded and filled the skeleton file, upload it in the form below and submit.</li>
            </ol>
          </div>

          {/* ─── Download Template ─── */}
          <div className="action-section">
            <button
              className="btn-primary"
              onClick={downloadTemplate}
              disabled={isDownloadingTemplate}
            >
              <i className="bi bi-download"></i>
              {isDownloadingTemplate ? "Downloading..." : "Download CSV with Reference Data"}
            </button>
          </div>

          {/* ─── Upload Section ─── */}
          <div className="upload-section">
            <h4>Upload Category File</h4>
            <div className="upload-box">
              <div className="file-input-wrapper">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="file-input"
                  id="fileInput"
                />
                <label htmlFor="fileInput" className="file-label">
                  <i className="bi bi-folder"></i> Choose File
                </label>
                <span className="file-name">{fileName || "No file chosen"}</span>
              </div>
            </div>
            <button
              className="btn-upload"
              onClick={handleUpload}
              disabled={!file || isUploading}
            >
              <i className="bi bi-upload"></i>
              {isUploading ? "Uploading..." : "Upload CSV"}
            </button>
          </div>

          {/* ─── Bulk Export ─── */}
          <div className="export-section">
            <h4>Bulk Export</h4>
            <p>Download your category database in Excel format.</p>
            <button className="btn-export" onClick={handleExport} disabled={isExporting}>
              <i className="bi bi-download"></i>
              {isExporting ? "Exporting..." : "Export Excel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}