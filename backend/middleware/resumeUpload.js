/**
 * resumeUpload.js — Multer middleware for resume files (PDF / ZIP)
 *
 * Uses multer-gridfs-storage to stream files directly into MongoDB.
 *
 * Accepts: application/pdf, application/zip, application/x-zip-compressed
 * Max size: 10 MB
 * Field name: "resume"
 */

const multer = require("multer");
const path   = require("path");
const storage = require("./gridfsStorage");

// ─── File filter ──────────────────────────────────────────────────────────────
function fileFilter(_req, file, cb) {
  const ext  = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  const allowed =
    ext === ".pdf" ||
    ext === ".zip" ||
    mime === "application/pdf" ||
    mime === "application/zip" ||
    mime === "application/x-zip-compressed" ||
    mime === "application/octet-stream"; // some browsers send this for zip

  if (allowed) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only PDF and ZIP files are accepted."),
      false
    );
  }
}

// ─── Multer instance (GridFS storage — no disk/memory buffering) ──────────────
const resumeUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB hard limit
  },
});

module.exports = resumeUpload;
