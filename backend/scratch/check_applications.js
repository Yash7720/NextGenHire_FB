const mongoose = require("mongoose");
const Application = require("../models/Application");
const User = require("../models/User");
const Job = require("../models/Job");
require("dotenv").config();

async function checkApplications() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/nextgenhire");
    console.log("Connected to MongoDB");

    const apps = await Application.find().populate("userId", "name email").populate("jobId", "title");
    console.log(`Total Applications in DB: ${apps.length}`);
    
    apps.forEach((app, i) => {
      console.log(`${i+1}. User: ${app.userId?.name || 'Unknown'} (${app.userId?.email || 'N/A'}), Job: ${app.jobId?.title || 'Unknown'}, Status: ${app.status}`);
    });

    const uniqueUsers = new Set(apps.map(a => String(a.userId?._id || a.userId)));
    console.log(`Unique Applicants: ${uniqueUsers.size}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkApplications();
