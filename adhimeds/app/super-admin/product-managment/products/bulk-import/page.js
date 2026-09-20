"use client";

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import SERVERURL from "@/app/services/serverURL";
import "./bulk-import.css";

export default function ProductBulkImportPage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef(null);

  // ✅ Correct base URL for product routes (plural)
  const BASE_URL = `${SERVERURL}/api/products`;

  // ─── Download Template ──────────────────────────────────
  const downloadTemplate = useCallback(() => {
    try {
      const templateData = [
        {
          "productName*": "Paracetamol 500mg",
          "mainCategory": "Medicines",
          "brand": "Cipla",
          "unitPrice": 50,
          "stock": 100,
          "sku": "PARA-001",
          "description": "Pain reliever",
          "published": "true",
          "featured": "false",
          "todaysDeal": "false",
          "refundable": "true",
          "unit": "Strip",
          "weight": 0.5,
          "minPurchaseQty": 1,
          "tags": "pain, fever, headache",
          "metaTitle": "Paracetamol 500mg",
          "metaDescription": "Effective pain reliever",
          "freeShipping": "true",
          "flatRate": "false",
          "shippingDays": "2-3",
          "codAvailable": "true",
          "hsnCode": "30049099",
          "gstRate": 18,
        },
        {
          "productName*": "Amoxicillin 250mg",
          "mainCategory": "Medicines",
          "brand": "Sun Pharma",
          "unitPrice": 75,
          "stock": 50,
          "sku": "AMOX-001",
          "description": "Antibiotic",
          "published": "true",
          "featured": "false",
          "todaysDeal": "false",
          "refundable": "true",
          "unit": "Capsule",
          "weight": 0.3,
          "minPurchaseQty": 1,
          "tags": "antibiotic, infection",
          "metaTitle": "Amoxicillin 250mg",
          "metaDescription": "Antibiotic for bacterial infections",
          "freeShipping": "true",
          "flatRate": "false",
          "shippingDays": "2-3",
          "codAvailable": "true",
          "hsnCode": "30041030",
          "gstRate": 18,
        },
      ];
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Products");
      XLSX.writeFile(wb, "product_import_template.xlsx");
      toast.success("Template downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download template");
    }
  }, []);

  // ─── Upload File ────────────────────────────────────────
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
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(`${BASE_URL}/bulk-import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { message, imported, errors } = response.data;
      if (imported > 0) {
        toast.success(`✅ ${message}`);
        if (errors && errors.length > 0) {
          console.warn("Import errors:", errors);
          toast.error(`⚠️ ${errors.length} rows had errors (see console)`);
        }
        setFile(null);
        setFileName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.push("/super-admin/product-managment/products/all-product");
      } else {
        toast.error("No products were imported. Check the file format.");
        if (errors && errors.length > 0) {
          console.error("Import errors:", errors);
        }
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error.response?.data?.message || "Import failed");
    } finally {
      setIsUploading(false);
    }
  }, [file, router, BASE_URL]);

  // ─── Bulk Export ────────────────────────────────────────
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await axios.get(`${BASE_URL}/export`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "products_export.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Export completed successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error.response?.data?.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [BASE_URL]);

  return (
    <div className="category-page">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <div className="category-card">
        <div className="card-header">
          <h3>Product Bulk Upload</h3>
          <button
            className="btn-back"
            onClick={() => router.push("/super-admin/product-managment/products/all-product")}
          >
            ← Back
          </button>
        </div>

        <div className="import-content">
          {/* ─── Instructions ─── */}
          <div className="instructions">
            <ol>
              <li>Download the template file and fill it with proper data.</li>
              <li>Use the example data to understand the required format.</li>
              <li>Fields marked with * are required.</li>
              <li>Category and Brand names should match existing entries (case‑sensitive).</li>
              <li>Upload the completed file using the form below.</li>
            </ol>
          </div>

          {/* ─── Download Template ─── */}
          <div className="action-section">
            <button className="btn-primary" onClick={downloadTemplate}>
              <i className="bi bi-download"></i> Download Template
            </button>
          </div>

          {/* ─── Upload Section ─── */}
          <div className="upload-section">
            <h4>Upload Product File</h4>
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
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          </div>

          {/* ─── Bulk Export ─── */}
          <div className="export-section">
            <h4>Bulk Export</h4>
            <p>Download your product database in Excel format.</p>
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