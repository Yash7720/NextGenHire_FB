const express = require("express");
const router  = express.Router();
console.log("[debug] Registering Project Routes...");

const uploadProject = require("../middleware/projectUpload");
const { protect, admin } = require("../middleware/authMiddleware"); // Assuming authMiddleware exists
const { 
  submitProject, 
  getProjects, 
  downloadProject, 
  deleteProject 
} = require("../controllers/projectController");

// ─── Student: Submit a project ────────────────────────────────────────────────
// POST /api/projects/upload
router.post(
  "/projects/upload",
  protect,
  uploadProject.single("file"),
  submitProject
);

// ─── Admin: List all project submissions ─────────────────────────────────────
// GET /api/projects
router.get("/projects", protect, admin, getProjects);

// ─── Admin: Download a project ZIP ───────────────────────────────────────────
// GET /api/projects/download/:id
router.get("/projects/download/:id", protect, admin, downloadProject);

// ─── Admin: Delete a project submission ─────────────────────────────────────
// DELETE /api/projects/:id
router.delete("/projects/:id", protect, admin, deleteProject);

module.exports = router;
