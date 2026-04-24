const Quest = require("../models/Quest");
const User = require("../models/User");

// QUEST_TEMPLATES removed — power is now 100% from your MongoDB database!

/**
 * GET /api/quests/today
 * Fetch today's quests for the logged-in user. If none exist, generate them.
 */
exports.getTodayQuests = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : req.query.userId || null;
    
    // 1. Fetch user-specific quests
    let userQuests = [];
    if (userId) {
       userQuests = await Quest.find({ userId });
    }

    // 2. If user has no quests, clone the 'Global Templates' (those with no userId)
    if (userId && userQuests.length === 0) {
       console.log(`[questController] Initializing personal quests for user: ${userId}`);
       const templates = await Quest.find({ userId: { $exists: false } });
       
       if (templates.length > 0) {
          const clones = templates.map(t => ({
             userId,
             title:    t.title,
             desc:     t.desc,
             icon:     t.icon,
             type:     t.type,
             rarity:   t.rarity,
             progress: 0,
             max:      t.max,
             xp:       t.xp,
             status:   "pending",
             date:     new Date().toDateString()
          }));
          userQuests = await Quest.insertMany(clones);
          console.log(`[questController] Created ${userQuests.length} personal quests.`);
       }
    }

    // Fallback: return everything if for some reason nothing is found
    const finalQuests = userQuests.length > 0 ? userQuests : await Quest.find({});
    
    res.json({ success: true, quests: finalQuests });
  } catch (err) {
    console.error("[questController] getTodayQuests:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

/**
 * updateQuestProgress (Helper Utility)
 * Finds pending quests for a specific user and increments progress.
 * This is called from other controllers (lesson, auth, app, etc.)
 */
exports.updateQuestProgress = async (req, userId, actionType, increment = 1) => {
  try {
    if (!userId) return;

    // Find pending quests: those assigned to this user
    const query = { 
      status: "pending", 
      userId: userId
    };

    console.log(`[questController] updateQuestProgress: actionType=${actionType}, userId=${userId}`);
    const quests = await Quest.find(query);

    if (!quests.length) {
      console.log(`[questController] No pending quests found for user. Checking if we need to auto-assign a global template...`);
      // If we found nothing for the user, maybe they are acting on a global template for the first time
      const templateQuery = { status: "pending", userId: { $exists: false } };
      const templates = await Quest.find(templateQuery);
      
      for (let t of templates) {
         // Matching logic
         const matches = 
           t.type === actionType || 
           (actionType === "application" && (t.title.toLowerCase().includes("job") || t.title.toLowerCase().includes("apply")));
         
         if (matches) {
            console.log(`[questController] Auto-cloning global template "${t.title}" for user.`);
            const clone = new Quest({
               ...t.toObject(),
               _id: undefined,
               userId: userId,
               progress: 0,
            });
            quests.push(clone);
         }
      }
    }

    if (!quests.length) return;

    console.log(`[questController] DEBUG: Found ${quests.length} pending quests. Checking for matches...`);

    let updatedCount = 0;

    for (let q of quests) {
      const t = (q.type || "").toLowerCase();
      const title = (q.title || "").toLowerCase();

      // Check if this quest matches the action performed
      // Logic: match by 'type' field OR keyword in title as fallback for flexibility
      const matches = 
        t === actionType || 
        (actionType === "application" && (t.includes("job") || title.includes("apply") || title.includes("job"))) ||
        (actionType === "quiz" && (t.includes("quiz") || title.includes("quiz"))) ||
        (actionType === "lesson" && (t.includes("lesson") || title.includes("lesson"))) ||
        (actionType === "streak" && (t.includes("login") || t.includes("streak") || title.includes("streak")));

      console.log(`[questController] DEBUG: Checking quest "${q.title}" (ID: ${q._id}, Type: ${q.type}, UserId: ${q.userId || "NULL"}) - Match: ${matches}`);

      if (matches) {
        // Automatically 'assign' the quest to the user if it was global
        // This ensures the quest becomes user-specific from this point forward.
        if (!q.userId) {
           q.userId = userId;
           console.log(`[questController] DEBUG: Auto-assigned global quest "${q.title}" to user: ${userId}`);
        }

        q.progress += increment;
        console.log(`[questController] DEBUG: Increasing progress for "${q.title}" to ${q.progress}/${q.max}`);
        
        if (q.progress >= q.max) {
          q.progress = q.max;
          q.status   = "completed";
          console.log(`[questController] DEBUG: Quest "${q.title}" COMPLETED!`);
        }
        await q.save();
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      // Emit real-time update to the user's room
      const io = req.app.get("io");
      if (io) {
        const roomName = String(userId);
        io.to(roomName).emit("questsUpdated", { actionType, updatedCount, timestamp: Date.now() });
        console.log(`[socket] questsUpdated emitted to room: ${roomName} (${updatedCount} quests updated)`);
      }
    } else {
      console.log(`[questController] DEBUG: No quests matched the action "${actionType}".`);
    }
  } catch (err) {
    console.error("[questController] updateQuestProgress:", err.message);
  }
};

/**
 * POST /api/quests/claim
 * Marks a completed quest as claimed and awards XP.
 */
exports.claimQuest = async (req, res) => {
  try {
    const { questId } = req.body;
    const userId = req.user._id;

    // Fetch quest regardless of explicit userId for existing DB records
    const quest = await Quest.findById(questId);

    if (!quest) {
      return res.status(404).json({ success: false, error: "Quest not found" });
    }

    if (quest.status !== "completed") {
      return res.status(400).json({ success: false, error: "Quest not completed or already claimed" });
    }

    // Award XP
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    user.xp = (user.xp || 0) + quest.xp;
    quest.status = "claimed";

    // Record XP snapshot for analytics chart
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now = new Date();
    const month = MONTHS[now.getMonth()];
    const year = now.getFullYear();
    const existingEntry = (user.xpHistory || []).find(e => e.month === month && e.year === year);
    if (existingEntry) { existingEntry.xp = user.xp; }
    else { user.xpHistory = user.xpHistory || []; user.xpHistory.push({ month, year, xp: user.xp }); }

    await Promise.all([user.save(), quest.save()]);

    // Emit leaderboard update (global) and profile update (local)
    const io = req.app.get("io");
    if (io) {
      io.emit("leaderboardUpdate");
      io.to(userId.toString()).emit("questsUpdated", { claimed: true });
    }

    res.json({ 
      success: true, 
      msg: "Quest claimed!", 
      rewardXP: quest.xp,
      totalXP: user.xp
    });
  } catch (err) {
    console.error("[questController] claimQuest:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};