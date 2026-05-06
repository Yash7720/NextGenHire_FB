const express = require("express");
const router  = express.Router();

const {
  applyJob,
  getApplications,
  getUserApplications,
  updateApplicationStatus,
  downloadResume,
  deleteApplication,
} = require("../controllers/applicationController");

const resumeUpload = require("../middleware/resumeUpload");
const { protect }  = require("../middleware/authMiddleware");

// ── Apply for a job (multipart/form-data, optional resume file) ───────────────
// Public — student submits; auth is optional (userId sent from client)
router.post(
  "/apply",
  resumeUpload.single("resume"),   // multer memoryStorage, 10 MB, PDF/ZIP only
  applyJob
);

// ── Get all applications (admin) ──────────────────────────────────────────────
router.get("/", getApplications);

// ── Get applications for a specific user ─────────────────────────────────────
router.get("/user/:userId", getUserApplications);

// ── Update application status ─────────────────────────────────────────────────
router.patch("/:id/status", updateApplicationStatus);

// ── Download resume for an application (admin) ────────────────────────────────
// GET /api/applications/download/:id
router.get("/download/:id", downloadResume);

// ── Delete application + GridFS file (admin) ─────────────────────────────────
// DELETE /api/applications/application/:id
router.delete("/application/:id", deleteApplication);

module.exports = router;
// Refactor prompt generation for Gemini API - update 2

// Refactor controller logic for scalability - update 7

// Optimize AI fallback responses - update 12

// Update project submission endpoints - update 17
