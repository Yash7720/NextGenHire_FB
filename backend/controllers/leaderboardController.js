const User             = require("../models/User");
const { buildLeaderboard } = require("../utils/leaderboard");

/**
 * GET /api/leaderboard
 *
 * Fetches all users, computes composite scores dynamically,
 * sorts descending, assigns competition ranks, and returns clean JSON.
 *
 * Response shape per entry:
 *   { _id, name, xp, coursesCompleted, streak, score, badge, rank }
 *
 * HTTP 200  — ranked leaderboard array
 * HTTP 500  — server / database error
 */
exports.getLeaderboard = async (req, res) => {
  try {
    // Select only the fields we need — _id is always included by default.
    // email is included so the frontend can identify the current user ("YOU").
    const users = await User.find(
      {},
      "name email xp streak coursesCompleted createdAt"
    ).lean();

    const leaderboard = buildLeaderboard(users);

    res.status(200).json({
      success: true,
      count:   leaderboard.length,
      data:    leaderboard,
    });
  } catch (error) {
    console.error("[leaderboardController] getLeaderboard error:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
