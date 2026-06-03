const User             = require("../models/User");
const { calcScore }    = require("../utils/leaderboard");
// Breaking circular dependency by requiring inside methods:
// const questController  = require("./questController");

// ─── Helper: broadcast leaderboard refresh signal ────────────────────────────
function emitRefresh(req) {
  const io = req.app.get("io");
  if (io) io.emit("leaderboardUpdate");
}

// ─── Helper: auto-record monthly XP snapshot ─────────────────────────────────
// Called every time XP changes so the Profile analytics chart has data.
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function recordXpHistory(user) {
  const now   = new Date();
  const month = MONTHS[now.getMonth()];
  const year  = now.getFullYear();

  const existing = (user.xpHistory || []).find(
    (e) => e.month === month && e.year === year
  );

  if (existing) {
    existing.xp = user.xp; // Update current month's snapshot
  } else {
    user.xpHistory = user.xpHistory || [];
    user.xpHistory.push({ month, year, xp: user.xp });
  }

  // Keep only last 12 entries
  user.xpHistory.sort((a, b) =>
    a.year !== b.year ? a.year - b.year : MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)
  );
  if (user.xpHistory.length > 12) {
    user.xpHistory = user.xpHistory.slice(-12);
  }
}

// ─── Helper: build safe user response (no password) ──────────────────────────
function userPayload(user) {
  return {
    _id:              user._id,
    name:             user.name,
    email:            user.email,
    xp:               user.xp,
    coursesCompleted: user.coursesCompleted,
    streak:           user.streak,
    enrolledCourses:  user.enrolledCourses || [],
    score:            calcScore(user),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/complete-course
// Called when a user finishes a course (all chapters + quiz + project).
//
// Effect:  coursesCompleted += 1   XP += 200   streak += 1
// Body:    { userId }
// ─────────────────────────────────────────────────────────────────────────────
exports.completeCourse = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Atomic increments
    user.coursesCompleted += 1;
    user.xp              += 200;
    user.streak          += 1;
    recordXpHistory(user);

    await user.save();
    emitRefresh(req);

    res.status(200).json({
      success: true,
      message: `Course completed! +200 XP, streak now ${user.streak}`,
      user:    userPayload(user),
    });
  } catch (err) {
    console.error("[userController] completeCourse:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/daily-login
// Called once per calendar day when a user logs in.
// Prevents multiple awards on the same day using lastLoginDate.
//
// Effect:  streak += 1   XP += 50
// Body:    { userId }
// ─────────────────────────────────────────────────────────────────────────────
exports.dailyLogin = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Only award once per calendar day
    const today     = new Date().toDateString();
    const lastLogin = user.lastLoginDate
      ? new Date(user.lastLoginDate).toDateString()
      : null;

    if (lastLogin === today) {
      return res.status(200).json({
        success: true,
        alreadyClaimed: true,
        message: "Daily login already claimed today.",
        user: userPayload(user),
      });
    }

    // Check if previous login was yesterday — keep streak going otherwise reset
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = lastLogin === yesterday.toDateString();

    user.streak        = wasYesterday ? user.streak + 1 : 1; // reset if gap > 1 day
    user.xp           += 50;
    user.lastLoginDate = new Date();
    recordXpHistory(user);

    await user.save();
    
    // Update Streak Quest
    const questController = require("./questController");
    await questController.updateQuestProgress(req, userId, "streak");
    
    emitRefresh(req);

    res.status(200).json({
      success: true,
      alreadyClaimed: false,
      message: `Daily login bonus! +50 XP, streak now ${user.streak}`,
      user:    userPayload(user),
    });
  } catch (err) {
    console.error("[userController] dailyLogin:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/add-xp
// General-purpose XP award (chapter complete, quest, job apply, spin wheel
// etc.). Kept here so all user mutations live in one controller.
//
// Body: { userId, amount }
// ─────────────────────────────────────────────────────────────────────────────
exports.addXp = async (req, res) => {
  try {
    const { userId, xp, amount } = req.body;

    const xpToAdd =
      typeof amount === "number" ? amount :
      typeof xp     === "number" ? xp :
      Number(amount || xp || 0);

    if (!Number.isFinite(xpToAdd) || xpToAdd < 0) {
      return res.status(400).json({ success: false, error: "Invalid XP value" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    user.xp = (user.xp || 0) + xpToAdd;
    recordXpHistory(user);
    await user.save();

    // Mapping XP amounts to quest types based on frontend gainXP() logic:
    // 5 XP = lesson, 50 XP = quiz, 200 XP = project/course
    const questController = require("./questController");
    if (xpToAdd === 5) {
      await questController.updateQuestProgress(req, userId, "lesson");
    } else if (xpToAdd === 50) {
      await questController.updateQuestProgress(req, userId, "quiz");
    } else if (xpToAdd === 20) {
      await questController.updateQuestProgress(req, userId, "application");
    }

    emitRefresh(req);

    res.status(200).json({
      success: true,
      user: userPayload(user),
    });
  } catch (err) {
    console.error("[userController] addXp:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/user/update-stats
// Directly set streak, coursesCompleted, or enrolledCourses (used by frontend sync).
//
// Body: { userId, streak?, coursesCompleted?, enrolledCourses? }
// ─────────────────────────────────────────────────────────────────────────────
exports.updateStats = async (req, res) => {
  try {
    const { userId, streak, coursesCompleted, enrolledCourses } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    // PROTECT AUTHENTICATED DATA:
    // Only update coursesCompleted if the new value is HIGHER (preventing accidental resets).
    // Streak should ONLY be updated via the dedicated dailyLogin endpoint or internal server logic.
    if (typeof coursesCompleted === "number" && Number.isFinite(coursesCompleted)) {
      if (coursesCompleted > (user.coursesCompleted || 0)) {
        user.coursesCompleted = coursesCompleted;
      }
    }
    
    // Sync enrolledCourses if provided (one-time sync from localStorage)
    if (Array.isArray(enrolledCourses)) {
      // Merge unique entries
      const merged = new Set([...(user.enrolledCourses || []), ...enrolledCourses]);
      user.enrolledCourses = Array.from(merged);
    }

    await user.save();
    emitRefresh(req); // Real-time leaderboard update

    res.status(200).json({ 
      success: true, 
      user: userPayload(user) 
    });
  } catch (err) {
    console.error("[userController] updateStats:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/enroll
// Body: { userId, courseId }
// ─────────────────────────────────────────────────────────────────────────────
exports.enrollCourse = async (req, res) => {
  try {
    const { userId, courseId } = req.body;
    if (!userId || !courseId) return res.status(400).json({ success: false, error: "Missing required fields" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    if (!user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses.push(courseId);
      await user.save();
    }

    res.status(200).json({ success: true, user: userPayload(user) });
  } catch (err) {
    console.error("[userController] enrollCourse:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/user/:userId
// Fetch a single user's detailed profile (clean payload).
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.status(200).json({
      success: true,
      user:     userPayload(user),
    });
  } catch (err) {
    console.error("[userController] getUserProfile:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/seed-test-data   (BONUS — dev/testing only)
// Generates N random users with random XP / courses / streak so you can
// see the leaderboard ranking in action without manual data entry.
//
// Body: { count? }  (default 10, max 50)
// ─────────────────────────────────────────────────────────────────────────────
exports.seedTestData = async (req, res) => {
  // ⚠️  Disable this in production!
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ success: false, error: "Not allowed in production" });
  }

  try {
    const count  = Math.min(Number(req.body.count) || 10, 50);
    const bcrypt = require("bcryptjs");
    const hash   = await bcrypt.hash("Test@1234", 10); // shared password for test users

    const firstNames = ["Arjun","Priya","Ravi","Sneha","Vikram","Kavya","Rohan","Meera","Aditya","Pooja"];
    const lastNames  = ["Sharma","Patel","Verma","Singh","Kumar","Gupta","Shah","Mehta","Joshi","Rao"];
    const rand       = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const created = [];
    for (let i = 0; i < count; i++) {
      const name  = `${rand(firstNames)} ${rand(lastNames)}`;
      const email = `test_${Date.now()}_${i}@nextgenhire.dev`;

      const user = await User.create({
        name,
        email,
        password:         hash,
        xp:               Math.floor(Math.random() * 800),
        coursesCompleted: Math.floor(Math.random() * 6),
        streak:           Math.floor(Math.random() * 15),
      });

      created.push({ name: user.name, email: user.email, xp: user.xp, score: calcScore(user) });
    }

    emitRefresh(req);

    res.status(201).json({
      success: true,
      message: `${created.length} test users created`,
      data:    created,
    });
  } catch (err) {
    console.error("[userController] seedTestData:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Auth controller updates

// Define User schema and validation rules

// Add password hashing logic to User model

// Optimize database query performance for users

// Define User schema and validation rules

// Add password hashing logic to User model

// Optimize database query performance for users

// Define User schema and validation rules

// Add role-based access control for admins

// Add password hashing logic to User model

// Update JWT expiration and security headers

// Optimize database query performance for users
