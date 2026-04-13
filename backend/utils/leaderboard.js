/**
 * leaderboard.js — shared leaderboard scoring utilities
 *
 * Centralising the formula here means the controller, tests, and any
 * future admin tools all stay in sync automatically.
 */

// ─── Scoring weights ──────────────────────────────────────────────────────────
const WEIGHTS = {
  xp:               1,    // 1 pt  per XP
  coursesCompleted: 200,  // 200 pts per completed course
  streak:           50,   // 50 pts  per streak day
};

/**
 * Calculate a user's composite leaderboard score.
 *
 * @param {{ xp?: number, coursesCompleted?: number, streak?: number }} user
 * @returns {number}
 */
function calcScore(user) {
  return (
    (Number(user.xp)               || 0) * WEIGHTS.xp               +
    (Number(user.coursesCompleted)  || 0) * WEIGHTS.coursesCompleted +
    (Number(user.streak)            || 0) * WEIGHTS.streak
  );
}

// ─── Badge tiers ──────────────────────────────────────────────────────────────
const BADGE_TIERS = [
  { minScore: 5000, badge: "🏆 Legend"  },
  { minScore: 2500, badge: "💎 Master"  },
  { minScore: 1000, badge: "⚡ Pro"     },
  { minScore: 300,  badge: "🔥 Warrior" },
  { minScore: 0,    badge: "🎯 Recruit" },
];

/**
 * Return the badge label for a given score.
 *
 * @param {number} score
 * @returns {string}
 */
function getBadge(score) {
  for (const { minScore, badge } of BADGE_TIERS) {
    if (score >= minScore) return badge;
  }
  return "🎯 Recruit";
}

/**
 * Take a flat array of scored user objects and assign competition ranks.
 * Users with the same score share the same rank (1-1-3, not 1-2-3).
 *
 * The array is expected to be sorted by score DESC already.
 *
 * @param {Array<object>} users  - sorted scored user objects
 * @returns {Array<object>}      - same objects enriched with `rank` field
 */
function assignRanks(users) {
  let lastScore = null;
  let lastRank  = 0;

  return users.map((u, i) => {
    if (lastScore === null || u.score !== lastScore) {
      lastRank  = i + 1;
      lastScore = u.score;
    }
    return { ...u, rank: lastRank };
  });
}

/**
 * Build a fully-ranked leaderboard from a raw MongoDB user array.
 *
 * Steps:
 *  1. Map each user → { name, xp, coursesCompleted, streak, score, badge }
 *  2. Sort by score DESC, then createdAt ASC (older account wins tie)
 *  3. Assign competition ranks
 *
 * @param {import("mongoose").Document[]} users
 * @returns {Array<object>}
 */
function buildLeaderboard(users) {
  // 1. Score & shape
  const scored = users.map((u) => ({
    _id:              u._id,
    name:             u.name,
    email:            u.email,
    xp:               Number(u.xp)              || 0,
    coursesCompleted: Number(u.coursesCompleted) || 0,
    streak:           Number(u.streak)           || 0,
    score:            calcScore(u),
    badge:            getBadge(calcScore(u)),
    createdAt:        u.createdAt,
  }));

  // 2. Sort
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;           // score DESC
    return new Date(a.createdAt) - new Date(b.createdAt);        // createdAt ASC (tiebreak)
  });

  // 3. Rank
  return assignRanks(scored);
}

module.exports = { calcScore, getBadge, assignRanks, buildLeaderboard, WEIGHTS };
