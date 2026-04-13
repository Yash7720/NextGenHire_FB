const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Application = require("../models/Application");
const User = require("../models/User");

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const allApps = await Application.find().lean();
    console.log(`Checking ${allApps.length} applications...`);

    let deletedCount = 0;
    for (const app of allApps) {
      if (!app.userId) {
          // If no userId, check email as fallback (though userId is preferred)
          if (app.email) {
              const userExist = await User.findOne({ email: app.email });
              if (!userExist) {
                  console.log(`Deleting application for non-existent email: ${app.email}`);
                  await Application.findByIdAndDelete(app._id);
                  deletedCount++;
              }
          } else {
              console.log(`Deleting application with no userId and no email.`);
              await Application.findByIdAndDelete(app._id);
              deletedCount++;
          }
          continue;
      }

      const userExist = await User.findById(app.userId);
      if (!userExist) {
        console.log(`Deleting orphan application for userId: ${app.userId} (Email: ${app.email})`);
        await Application.findByIdAndDelete(app._id);
        deletedCount++;
      }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} orphan applications.`);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}

cleanup();
