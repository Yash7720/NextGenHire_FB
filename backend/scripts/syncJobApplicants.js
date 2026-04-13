const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");

async function sync() {
  try {
    console.log("[sync] Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[db] Connected");

    const users = await User.find({}, "name email appliedJobs");
    const jobs = await Job.find({});
    
    console.log(`[sync] Found ${users.length} users and ${jobs.length} jobs`);

    // Map to store counts: jobId -> Set of user emails (to avoid duplicates)
    const applicationMap = new Map();

    users.forEach(user => {
      if (Array.isArray(user.appliedJobs)) {
        user.appliedJobs.forEach(jobId => {
          // jobId could be string or numeric ID depending on the version
          const key = String(jobId);
          if (!applicationMap.has(key)) {
            applicationMap.set(key, new Set());
          }
          applicationMap.get(key).add(user.email);
        });
      }
    });

    for (const job of jobs) {
      const jobIdStr = String(job._id);
      const applicants = applicationMap.get(jobIdStr) || new Set();
      const count = applicants.size;
      
      console.log(`[sync] Job "${job.title}" (${jobIdStr}): ${count} applicants`);
      
      // Update Job applicants count
      job.applicants = count;
      await job.save();

      // Ensure Application documents exist for these users
      for (const email of applicants) {
        const user = users.find(u => u.email === email);
        const existingApp = await Application.findOne({ jobId: job._id, email: email });
        
        if (!existingApp) {
          console.log(`[sync] Creating Application record for ${email} -> ${job.title}`);
          await Application.create({
            jobId: job._id,
            applicantName: user?.name || "Anonymous",
            email: email,
            status: "pending"
          });
        }
      }
    }

    const finalJobs = await Job.find({}, "title applicants");
    console.log("[sync] Final Job Counts:", JSON.stringify(finalJobs, null, 2));
    console.log("[sync] Successfully synchronized all jobs.");

    process.exit(0);
  } catch (err) {
    console.error("[sync] Error:", err.message);
    process.exit(1);
  }
}

sync();
