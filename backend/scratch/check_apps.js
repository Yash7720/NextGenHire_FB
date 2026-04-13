const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Application = require("../models/Application");
const User = require("../models/User");
const Job = require("../models/Job");

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const appCount = await Application.countDocuments();
    console.log(`Total Applications in DB: ${appCount}`);

    const apps = await Application.find().lean();
    apps.forEach((app, i) => {
      console.log(`${i+1}. JobId: ${app.jobId}, Email: ${app.email}, UserId: ${app.userId}`);
    });

    const studentUsers = await User.find({ role: 'student' }).lean();
    console.log(`Found ${studentUsers.length} student users.`);
    studentUsers.forEach(u => {
      console.log(`User: ${u.name} (${u.email}), AppliedJobs count: ${u.appliedJobs ? u.appliedJobs.length : 0}`);
    });

    const allUsersCount = await User.countDocuments();
    console.log(`Total users in DB: ${allUsersCount}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkData();
