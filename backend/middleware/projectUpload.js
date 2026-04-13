const multer = require("multer");
const path   = require("path");

/**
 * projectUpload — Middleware for handling large project ZIP uploads.
 *
 * Config:
 * - Storage: GridFS (direct streaming to MongoDB)
 * - Limit: 500 MB
 * - Type: .zip only
 */

const storage = require("./gridfsStorage");

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Validation for ZIP files
  const allowedExtensions = [".zip"];
  const allowedMimeTypes = [
    "application/zip",
    "application/x-zip-compressed",
    "application/octet-stream"
  ];

  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only .zip files are allowed."), false);
  }
};

const uploadProject = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB limit
  },
});

module.exports = uploadProject;
