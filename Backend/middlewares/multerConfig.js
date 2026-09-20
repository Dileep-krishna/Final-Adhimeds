import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = "imgUploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "imgUploads");
  },
  filename: (req, file, cb) => {
    const original = file.originalname;
    const sanitized = original
      .replace(/\s+/g, "_")                // spaces → underscores
      .replace(/[^\w.-]/g, "");            // remove other special chars
    cb(null, `file-${Date.now()}-${sanitized}`);
  },
});

const fileFilter = (req, file, cb) => {
  // 1. Images – allowed for any field
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
    return;
  }

  // 2. Videos – only for specific fields
  if (
    (file.fieldname === "videoFile" || file.fieldname === "videoThumbnail") &&
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
    return;
  }

  // 3. PDF / DOC / DOCX – for prescription, specs, or bills
  if (
    (file.fieldname === "pdfSpec" ||
     file.fieldname === "prescriptionFile" ||
     file.fieldname === "bill") &&
    (file.mimetype === "application/pdf" ||
     file.mimetype === "application/msword" ||
     file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
  ) {
    cb(null, true);
    return;
  }

  // ─── NEW: CSV/Excel – for bulk import (fieldname "file") ───
  if (
    file.fieldname === "file" &&
    (file.mimetype === "text/csv" ||
     file.mimetype === "application/csv" ||
     file.mimetype === "application/vnd.ms-excel" ||
     file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  ) {
    cb(null, true);
    return;
  }

  // Everything else – reject
  cb(new Error(`File type not allowed for field "${file.fieldname}"`), false);
};

const multerConfig = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export default multerConfig;