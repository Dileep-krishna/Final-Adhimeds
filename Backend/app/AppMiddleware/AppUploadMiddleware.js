import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDirectory = "imgUploads";

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const filename = `prescription-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${extension}`;

    cb(null, filename);
  },
});

const allowedExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
];

const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/octet-stream",
];

const fileFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const mimeType = file.mimetype.toLowerCase();

  const extensionAllowed =
    allowedExtensions.includes(extension);

  const mimeTypeAllowed =
    allowedMimeTypes.includes(mimeType);

  if (extensionAllowed && mimeTypeAllowed) {
    return cb(null, true);
  }

  if (extensionAllowed) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "Only JPG, JPEG, PNG, WEBP and PDF files are allowed"
    ),
    false
  );
};

const uploadPrescriptionFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export default uploadPrescriptionFile;