const User        = require("../models/User");
const Job         = require("../models/Job");
const Application = require("../models/Application");
const Notification = require("../models/Notification");
const Project     = require("../models/Project");
const Quest       = require("../models/Quest");
const { buildLeaderboard, getBadge } = require("../utils/leaderboard");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users
// List all registered users (no password)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id
// Remove a user by ID and all their associated data (Cascade Delete)
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  const userId = req.params.id;
  console.log(`[adminController] Attempting cascade delete for user: ${userId}`);

  try {
    // Perform cascading delete in parallel for speed
    const [userDeleted, apps, notifications, projects, quests] = await Promise.all([
      User.findByIdAndDelete(userId),
      Application.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      Project.deleteMany({ studentId: userId }), // Fixed: Project model uses studentId
      Quest.deleteMany({ userId }),
    ]);

    if (!userDeleted) {
      console.warn(`[adminController] Delete failed: User ${userId} not found.`);
      return res.status(404).json({ success: false, error: "User not found" });
    }

    console.log(`[adminController] Successfully deleted user ${userId} and all associated items.`);
    console.log(`[adminController] Cascade results -> Apps: ${apps.deletedCount}, Notifs: ${notifications.deletedCount}, Projects: ${projects.deletedCount}, Quests: ${quests.deletedCount}`);
    
    // Trigger real-time refresh
    req.app.get("io")?.emit("leaderboardUpdate");

    res.json({ 
      success: true, 
      message: "User and all associated data deleted successfully",
      details: {
        applications: apps.deletedCount || 0,
        notifications: notifications.deletedCount || 0,
        projects: projects.deletedCount || 0,
        quests: quests.deletedCount || 0
      }
    });
  } catch (error) {
    console.error(`[adminController] CRITICAL ERROR during deleteUser(${userId}):`, error);
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error during cascading delete",
      message: error.message 
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/candidates
//
// Returns every student user enriched with:
//   score       — composite leaderboard score
//   badge       — tier badge label
//   skills      — array of top skill names derived from DB skills[]
//   status      — candidateStatus field (default "pending")
//   applied     — appliedJobs count
//   avatar      — avatar emoji
//
// Query params:
//   ?status=shortlisted|interview|pending|rejected   (filter)
//   ?search=name_or_skill                             (search)
//   ?sort=xp|score|name                              (default score)
// ─────────────────────────────────────────────────────────────────────────────
exports.getCandidates = async (req, res) => {
  try {
    const { status, search, sort = "score" } = req.query;

    // Fetch ALL users (including admins for this dev environment so they show up as candidates)
    let query = { role: { $in: ["student", "recruiter", "admin", null, undefined] } };

    // For status filter, only filter on docs that have candidateStatus field
    if (status && status !== "all") {
      query = {
        ...query,
        $or: [
          { candidateStatus: status },
          // For "pending" also include users who don't have candidateStatus set yet
          ...(status === "pending" ? [{ candidateStatus: { $exists: false } }] : []),
        ],
      };
    }

    let users = await User.find(query).select("-password").lean();
    console.log(`[adminController] getCandidates: found ${users.length} users (query: ${JSON.stringify({ status, search, sort })})`);

    // Search by name or skill name
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      users = users.filter(u => {
        const nameMatch  = u.name?.toLowerCase().includes(term);
        const skillMatch = (u.skills || []).some(s => s.name?.toLowerCase().includes(term));
        return nameMatch || skillMatch;
      });
    }

    // Enrich each user
    const enriched = users.map(u => {
      const score = (Number(u.xp) || 0)
        + (Number(u.coursesCompleted) || 0) * 200
        + (Number(u.streak) || 0) * 50;

      // Top 3 skills by score
      const topSkills = [...(u.skills || [])]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 3)
        .map(s => s.name);

      // Fit score on a 0–100 "candidate score" (normalised from leaderboard max ~5000)
      const candidateScore = Math.max(20, Math.min(99, Math.round((score / 5000) * 100)));

      return {
        _id:             u._id,
        name:            u.name,
        email:           u.email,
        avatar:          u.avatar || "⭐",
        xp:              u.xp || 0,
        streak:          u.streak || 0,
        coursesCompleted: u.coursesCompleted || 0,
        score,
        candidateScore,
        badge:           getBadge(score),
        skills:          topSkills,
        appliedJobs:     (u.appliedJobs || []).length,
        status:          u.candidateStatus || "pending",
        degree:          u.degree || "",
        createdAt:       u.createdAt,
      };
    });

    // Sort
    if (sort === "xp")    enriched.sort((a, b) => b.xp - a.xp);
    else if (sort === "name") enriched.sort((a, b) => a.name.localeCompare(b.name));
    else                      enriched.sort((a, b) => b.score - a.score); // default

    res.status(200).json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    console.error("[adminController] getCandidates:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/candidates/:id/status
// Update a candidate's recruitment status
// Body: { status: "pending" | "shortlisted" | "interview" | "rejected" }
// ─────────────────────────────────────────────────────────────────────────────
exports.updateCandidateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const VALID = ["pending", "shortlisted", "interview", "rejected"];

    if (!VALID.includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status value" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { candidateStatus: status },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Trigger real-time refresh
    req.app.get("io")?.emit("leaderboardUpdate");

    res.status(200).json({ success: true, data: { _id: user._id, status: user.candidateStatus } });
  } catch (error) {
    console.error("[adminController] updateCandidateStatus:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/skill-rankings
//
// Returns a ranked list of users enriched with per-skill scores for the
// "Skill Score Leaderboard" / AdminRankings page.
//
// Response per entry:
//   { _id, name, avatar, xp, streak, coursesCompleted, score, badge, rank,
//     skills: [{ name, score, color }], topSkill }
// ─────────────────────────────────────────────────────────────────────────────
exports.getSkillRankings = async (req, res) => {
  try {
    const users = await User.find(
      {}, // Include everyone
      "name email avatar xp streak coursesCompleted skills createdAt"
    ).lean();

    const ranked = buildLeaderboard(users);

    // Re-attach skills array (buildLeaderboard strips it)
    const skillMap = {};
    users.forEach(u => { skillMap[String(u._id)] = u.skills || []; });

    const enriched = ranked.map(u => {
      const skills  = skillMap[String(u._id)] || [];
      const topSkill = skills.reduce((best, s) =>
        (s.score || 0) > (best?.score || 0) ? s : best, null
      );
      const avatar = users.find(raw => String(raw._id) === String(u._id))?.avatar || "⭐";

      return {
        ...u,
        avatar,
        skills,
        topSkill: topSkill?.name || "—",
      };
    });

    res.status(200).json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    console.error("[adminController] getSkillRankings:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/jobs
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/jobs/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteJob = async (req, res) => {
  const { id } = req.params;
  const mongoose = require("mongoose");
  
  try {
    console.log(`[adminController] Request to delete job. ID received: "${id}"`);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.error(`[adminController] Invalid Job ID format: ${id}`);
      return res.status(400).json({ success: false, error: "Invalid Job ID format" });
    }
    
    // Perform cascading delete
    const [jobDeleted, applicationsDeleted] = await Promise.all([
      Job.findByIdAndDelete(id),
      Application.deleteMany({ jobId: new mongoose.Types.ObjectId(id) })
    ]);

    if (!jobDeleted) {
      console.warn(`[adminController] Job not found in DB: ${id}`);
      return res.status(404).json({ success: false, error: "Job posting not found" });
    }

    console.log(`[adminController] Successfully deleted job "${jobDeleted.title}". Applications removed: ${applicationsDeleted.deletedCount}`);
    
    // Trigger real-time refresh
    req.app.get("io")?.emit("leaderboardUpdate");

    res.json({ 
      success: true, 
      message: "Job deleted successfully",
      details: {
        title: jobDeleted.title,
        applicationsRemoved: applicationsDeleted.deletedCount
      }
    });
  } catch (error) {
    console.error(`[adminController] CRITICAL ERROR in deleteJob:`, error.message);
    res.status(500).json({ success: false, error: "Internal server error during job deletion" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/applications
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find().populate("jobId");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard-stats
// ─────────────────────────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const [jobs, userCount, users] = await Promise.all([
      Job.find().lean(),
      User.countDocuments({ role: { $ne: 'admin' } }), 
      User.find({ role: { $ne: 'admin' } }).select("candidateStatus").lean()
    ]);

    // Calculate total applications only for existing users to prevent "ghost" counts
    // 1. Get all valid student IDs
    const studentUserIds = await User.find({ role: { $ne: 'admin' } }).distinct("_id");
    
    // 2. Count applications belonging to these users
    const appCount = await Application.countDocuments({ userId: { $in: studentUserIds } });

    // Status counts from User candidateStatus (this aligns with AdminCandidates management)
    const statusCounts = { pending: 0, shortlisted: 0, interview: 0, rejected: 0 };
    users.forEach(u => {
      const s = (u.candidateStatus || "pending").toLowerCase();
      if (statusCounts.hasOwnProperty(s)) statusCounts[s]++;
      else statusCounts.pending++;
    });

    // Format status data for Pie Chart (matching AdminDashboard.jsx palette)
    const statusData = [
      { name: 'Pending',     value: statusCounts.pending,     color: '#94a3b8' },
      { name: 'Shortlisted', value: statusCounts.shortlisted, color: '#ffd700' },
      { name: 'Interview',   value: statusCounts.interview,   color: '#00ff9d' },
      { name: 'Rejected',    value: statusCounts.rejected,    color: '#ff2d78' },
    ];

    // Applications per job for Bar Chart — Calculate dynamically to ensure sync with Application count
    const appPerJob = await Promise.all(jobs.map(async (j) => {
      const count = await Application.countDocuments({ 
        jobId: j._id,
        userId: { $in: studentUserIds } 
      });
      return {
        name: (j.title || 'Job').split(' ').slice(0, 2).join(' '),
        applicants: count
      };
    }));

    res.status(200).json({
      success: true,
      stats: {
        activeJobs: jobs.length,
        totalApplied: appCount,
        platformUsers: userCount,
        statusData,
        appPerJob
      }
    });
  } catch (error) {
    console.error("[adminController] getDashboardStats error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
// Admin controller updates
