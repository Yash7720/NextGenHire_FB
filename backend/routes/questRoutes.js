const express = require("express");
const router = express.Router();
const { getTodayQuests, claimQuest } = require("../controllers/questController");
const { protect } = require("../middleware/authMiddleware");

// GET /api/quests/today
router.get("/today", protect, getTodayQuests);

// POST /api/quests/claim
router.post("/claim", protect, claimQuest);

module.exports = router;
