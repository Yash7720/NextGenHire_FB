const Job = require("../models/Job");

// Create Job
exports.createJob = async (req, res) => {
  try {
    const payload = req.body || {};
    const job = await Job.create({
      title: payload.title,
      company: payload.company,
      location: payload.location || "Remote",
      salary: payload.salary,
      description: payload.description || `${payload.title || "Job"} at ${payload.company || "Company"}`,
      type: payload.type || "Full-time",
      level: payload.level || "Mid",
      skills: Array.isArray(payload.skills)
        ? payload.skills
        : typeof payload.skills === "string"
          ? payload.skills.split(",").map(s => s.trim()).filter(Boolean)
          : [],
      deadline: payload.deadline || "",
      applicants: typeof payload.applicants === "number" ? payload.applicants : 0,
      logo: payload.logo || "🏢",
    });

    // Trigger real-time refresh (new job added)
    req.app.get("io")?.emit("leaderboardUpdate");

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Jobs
exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};