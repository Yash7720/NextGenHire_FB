const express    = require("express");
const router     = express.Router();
const { getLeaderboard } = require("../controllers/leaderboardController");

/**
 * @route   GET /api/leaderboard
 * @desc    Returns users ranked by composite score (xp + courses×200 + streak×50)
 * @access  Public
 */
router.get("/", getLeaderboard);

module.exports = router;