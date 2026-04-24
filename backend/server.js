console.log("[debug] Server starting...");
require("dotenv").config();
// Triggering server refresh - Project Submission System upgraded to GridFS 
console.log("[debug] project-system: GridFS + 500MB enabled");
console.log("[debug] Dotenv loaded, MONGO_URI exists:", !!process.env.MONGO_URI);

const http      = require("http");
const path      = require("path");
const express   = require("express");
const cors      = require("cors");
const mongoose  = require("mongoose");
const { Server } = require("socket.io");
const cron = require("node-cron");
const Quest = require("./models/Quest");
const { initGridFS } = require("./config/gridfs");

// ─── App & Server ─────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(server, { cors: { origin: "*" } });

// Make io available in every controller via req.app.get("io")
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);

  // User joins their own private room for targeted quest/notif updates
  socket.on("join-room", (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`[socket] user ${userId} joined room: ${userId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

// ─── Cron Jobs ───────────────────────────────────────────────────────────────
// Reset / Cleanup old quests every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("[cron] Running daily quest cleanup...");
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];
    
    // Optionally: delete very old un-claimed quests or move to history
    // For now, we just log it. Quests are generated lazily per user today.
  } catch (err) {
    console.error("[cron] cleanup error:", err.message);
  }
});

// ─── Middleware ───────────────────────────────────────────────────────────────
// Robust CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://netgenhire.netlify.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(null, true); // Fallback to allowing all while debugging, or use: callback(new Error('CORS fail'), false)
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 204
}));

// Manual pre-flight handler for extra reliability
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",          require("./routes/authRoutes"));
app.use("/api/jobs",          require("./routes/jobRoutes"));
app.use("/api/applications",  require("./routes/applicationRoutes"));
app.use("/api/admin",         require("./routes/adminRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/quests",        require("./routes/questRoutes"));
app.use("/api/leaderboard",   require("./routes/leaderboardRoutes"));
app.use("/api/lessons",       require("./routes/lessonRoutes"));
app.use("/api/profile",       require("./routes/profileRoutes"));

// /api/user  — game events (complete-course, daily-login, add-xp, …)
// /api/users — list all users (admin)
app.use("/api/user",  require("./routes/userRoutes"));
app.use("/api/users", require("./routes/userRoutes")); // backward-compat alias
app.use("/api/chat",  require("./routes/chatbotRoutes"));

// ─── Project Submission routes ────────────────────────────────────────────────
// MOUNTED AT /api (sub-routes specify /projects)
app.use("/api", require("./routes/projectRoutes"));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "ok", message: "NextGenHire API running" }));

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.path}` });
});

// ─── MongoDB ──────────────────────────────────────────────────────────────────
mongoose.set("bufferCommands", false);
mongoose.connect(process.env.MONGO_URI, {
  tls: true,
  tlsAllowInvalidCertificates: true,
  family: 4,
  serverSelectionTimeoutMS: 5000
})
  .then(() => {
    console.log("[db] MongoDB connected");
    initGridFS(); // initialise GridFSBucket for resume uploads
  })
  .catch((err) => {
    console.error("[db] MongoDB connection error:", err.message);
    // process.exit(1);
  });

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`[server] Running on port ${PORT}`);
});