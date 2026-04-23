const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");

/**
 * All routes mounted at /api/user  (note: singular, matches the spec)
 *
 * GET  /api/users            → list all users (admin)
 * POST /api/user/complete-course  → award course completion
 * POST /api/user/daily-login      → award daily streak bonus
 * POST /api/user/add-xp           → award arbitrary XP
 * PATCH /api/user/update-stats    → sync streak / coursesCompleted from frontend
 * POST /api/user/seed-test-data   → generate random test users (dev only)
 */

// GET all users — admin / debug use
router.get("/", protect, admin, async (req, res) => {
  try {
    const User  = require("../models/User");
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET profile for current user
router.get("/:userId", ctrl.getUserProfile);

// ── Core game events ──────────────────────────────────────────────────────────
router.post("/complete-course",  ctrl.completeCourse);  // courses+1, xp+200, streak+1
router.post("/daily-login",      ctrl.dailyLogin);       // streak+1, xp+50 (once per day)
router.post("/add-xp",           ctrl.addXp);           // arbitrary XP award
router.post("/enroll",          ctrl.enrollCourse);    // track active courses

// ── Sync endpoint (called by frontend to push localStorage → DB) ──────────────
router.patch("/update-stats",    ctrl.updateStats);

// ── Dev / testing only ────────────────────────────────────────────────────────
router.post("/seed-test-data", protect, admin, ctrl.seedTestData);    // blocked in production

module.exports = router;

// Create user registration and login endpoints

// Secure API routes with authentication middleware

// Create user registration and login endpoints

// Secure API routes with authentication middleware

// Create user registration and login endpoints
