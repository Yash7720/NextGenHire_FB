const express = require("express");
const router  = express.Router();

const {
  getAllUsers,
  deleteUser,
  getAllJobs,
  deleteJob,
  getAllApplications,
  getCandidates,
  updateCandidateStatus,
  getSkillRankings,
  getDashboardStats,
} = require("../controllers/adminController");

const { protect, admin } = require("../middleware/authMiddleware");

// All routes in this file require authentication and admin role
router.use(protect);
router.use(admin);

// ── Dashboard Stats ───────────────────────────────────────────────────────────
router.get("/dashboard-stats", getDashboardStats);

// ── Users management ──────────────────────────────────────────────────────────
router.get("/users",        getAllUsers);
router.delete("/users/:id", deleteUser);

// ── Candidates (enriched users for admin talent view) ─────────────────────────
// GET  /api/admin/candidates?status=&search=&sort=
// PATCH /api/admin/candidates/:id/status
router.get("/candidates",                  getCandidates);
router.patch("/candidates/:id/status",     updateCandidateStatus);

// ── Skill Rankings leaderboard ────────────────────────────────────────────────
// GET /api/admin/skill-rankings
router.get("/skill-rankings",              getSkillRankings);

// ── Job management ────────────────────────────────────────────────────────────
router.get("/jobs",        getAllJobs);
router.delete("/jobs/:id", deleteJob);

// ── Application management ────────────────────────────────────────────────────
router.get("/applications", getAllApplications);

module.exports = router;
// Add role-based access control for admins

// Update JWT expiration and security headers

// Add role-based access control for admins

// Update JWT expiration and security headers
