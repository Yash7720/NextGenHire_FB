const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Application = require("../models/Application");

async function migrate() {
  try {
    console.log("[migrate] Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[db] Connected");

    const applications = await Application.find({});
    console.log(`[migrate] Found ${applications.length} applications to process`);

    for (const app of applications) {
      if (!app.userId) {
        const user = await User.findOne({ email: app.email });
        if (user) {
          console.log(`[migrate] Linking application ${app._id} to user ${user.name} (${user._id})`);
          app.userId = user._id;
          await app.save();
        } else {
          console.log(`[migrate] No user found for email ${app.email}`);
        }
      }
    }

    console.log("[migrate] Successfully migrated all applications.");
    process.exit(0);
  } catch (err) {
    console.error("[migrate] Error:", err.message);
    process.exit(1);
  }
}

migrate();
