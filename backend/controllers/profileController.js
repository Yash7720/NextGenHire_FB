const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");


// ─── Helper: broadcast refresh signal to all connected clients ───────────────
function emitRefresh(req) {
  const io = req.app.get("io");
  if (io) io.emit("leaderboardUpdate");
}

// ─── Helper: safe profile response ───────────────────────────────────────────
function profilePayload(user) {
  return {
    _id:              user._id,
    name:             user.name,
    email:            user.email,
    role:             user.role,
    bio:              user.bio       || "",
    age:              user.age       ?? null,
    degree:           user.degree    || "",
    avatar:           user.avatar    || "⭐",
    xp:               user.xp               || 0,
    streak:           user.streak           || 0,
    coursesCompleted: user.coursesCompleted  || 0,
    score:            user.score            || 0,
    skills:           user.skills           || [],
    xpHistory:        user.xpHistory        || [],
    earnedBadges:     user.earnedBadges     || [],
    appliedJobs:      user.appliedJobs      || [],
    createdAt:        user.createdAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profile/:userId
// Returns the full profile data for a user.
// ─────────────────────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.status(200).json({ success: true, data: profilePayload(user) });
  } catch (err) {
    console.error("[profileController] getProfile:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/profile/:userId
// Update basic profile info: name, bio, age, degree, avatar.
// Requires: Bearer token (protect middleware)
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, age, degree, avatar } = req.body;
    const userId = req.params.userId;

    // Only the owner can edit their own profile
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (typeof name   === "string" && name.trim())  user.name   = name.trim();
    if (typeof bio    === "string")                  user.bio    = bio.trim().slice(0, 300);
    if (typeof degree === "string")                  user.degree = degree.trim();
    if (typeof avatar === "string" && avatar.trim()) user.avatar = avatar.trim();
    if (typeof age    === "number" && age >= 10 && age <= 100) user.age = age;

    await user.save();
    emitRefresh(req);
    res.status(200).json({ success: true, data: profilePayload(user) });
  } catch (err) {
    console.error("[profileController] updateProfile:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/profile/:userId/skills
// Upsert skill scores. Body: { skills: [{ name, score, color }] }
// Merges with existing skills (updates by name, appends new ones).
// Requires: Bearer token (protect middleware)
// ─────────────────────────────────────────────────────────────────────────────
exports.updateSkills = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const incoming = req.body.skills;
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return res.status(400).json({ success: false, error: "skills array is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Build a map of existing skills by name for quick lookup
    const skillMap = {};
    user.skills.forEach((s) => (skillMap[s.name.toLowerCase()] = s));

    incoming.forEach(({ name, score, color }) => {
      if (!name) return;
      const key = name.toLowerCase();
      if (skillMap[key]) {
        // Update existing
        if (typeof score === "number") skillMap[key].score = Math.min(100, Math.max(0, score));
        if (color) skillMap[key].color = color;
      } else {
        // Append new skill
        skillMap[key] = { name, score: score || 0, color: color || "#00f5ff" };
      }
    });

    user.skills = Object.values(skillMap);
    await user.save();
    emitRefresh(req);
    res.status(200).json({ success: true, data: profilePayload(user) });
  } catch (err) {
    console.error("[profileController] updateSkills:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/profile/:userId/badges
// Award a badge ID to the user (idempotent — won't duplicate).
// Body: { badgeId: string }
// ─────────────────────────────────────────────────────────────────────────────
exports.awardBadge = async (req, res) => {
  try {
    const { badgeId } = req.body;
    if (!badgeId) {
      return res.status(400).json({ success: false, error: "badgeId is required" });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (!user.earnedBadges.includes(badgeId)) {
      user.earnedBadges.push(badgeId);
      await user.save();
      emitRefresh(req);
    }

    res.status(200).json({ success: true, data: profilePayload(user) });
  } catch (err) {
    console.error("[profileController] awardBadge:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/profile/:userId/xp-history
// Append or update a month's XP entry.
// Body: { month: "Jan", year: 2025, xp: 120 }
// If an entry for (month, year) already exists it is overwritten.
// ─────────────────────────────────────────────────────────────────────────────
exports.appendXpHistory = async (req, res) => {
  try {
    const { month, year, xp } = req.body;

    if (!month || !year || typeof xp !== "number") {
      return res.status(400).json({ success: false, error: "month, year, and xp are required" });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const existing = user.xpHistory.find(
      (e) => e.month === month && e.year === year
    );

    if (existing) {
      existing.xp = xp;
    } else {
      user.xpHistory.push({ month, year, xp });
    }

    // Keep only the last 12 entries (sorted by year+month)
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    user.xpHistory.sort((a, b) =>
      a.year !== b.year
        ? a.year - b.year
        : MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)
    );
    if (user.xpHistory.length > 12) {
      user.xpHistory = user.xpHistory.slice(-12);
    }

    await user.save();
    res.status(200).json({ success: true, data: profilePayload(user) });
  } catch (err) {
    console.error("[profileController] appendXpHistory:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/profile/:userId/apply-job
// Record a job application on the profile.
// Body: { jobId: number }
// ─────────────────────────────────────────────────────────────────────────────
exports.applyJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    const userId = req.params.userId;
    console.log(`[profileController] applyJob hit: userId=${userId}, jobId=${jobId}`);
    
    if (jobId === undefined || jobId === null) {
      return res.status(400).json({ success: false, error: "jobId is required" });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const id = String(jobId);
    if (!user.appliedJobs.includes(id)) {
      user.appliedJobs.push(id);
      await user.save();
      emitRefresh(req);
    }

    res.status(200).json({ success: true, data: profilePayload(user) });
  } catch (err) {
    console.error("[profileController] applyJob:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
