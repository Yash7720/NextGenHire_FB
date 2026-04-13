const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");

/**
 * All routes mounted at /api/profile
 *
 * GET    /api/profile/:userId                 → get full profile (public)
 * PATCH  /api/profile/:userId                 → update name/bio/age/degree/avatar (auth required)
 * PATCH  /api/profile/:userId/skills          → upsert skill scores (auth required)
 * POST   /api/profile/:userId/badges          → award a badge (internal / no auth needed)
 * POST   /api/profile/:userId/xp-history      → append monthly XP entry (internal)
 * POST   /api/profile/:userId/apply-job       → record a job application (internal)
 */

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/:userId", ctrl.getProfile);

// ── Protected (requires JWT) ──────────────────────────────────────────────────
router.patch("/:userId",        protect, ctrl.updateProfile);
router.patch("/:userId/skills", protect, ctrl.updateSkills);

// ── Internal (called from other controllers / frontend, no auth gate) ─────────
router.post("/:userId/badges",      ctrl.awardBadge);
router.post("/:userId/xp-history",  ctrl.appendXpHistory);
router.post("/:userId/apply-job",   ctrl.applyJob);

module.exports = router;
