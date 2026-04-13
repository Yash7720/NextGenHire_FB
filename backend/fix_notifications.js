require("dotenv").config();
const mongoose = require("mongoose");
const Notification = require("./models/Notification");
const User = require("./models/User");

async function fixNotifications() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully!");

    // 1. Find the first user in the database
    const user = await User.findOne();
    if (!user) {
      console.error("❌ No users found in the database. Please register an account in the app first!");
      process.exit(1);
    }

    const userId = user._id;
    console.log(`🎯 Target User Found: ${user.name} (${user.email}) [ID: ${userId}]`);

    // 2. Update all notifications to belong to this user
    console.log("🔄 Updating all notifications...");
    const result = await Notification.updateMany({}, { $set: { userId: userId } });

    console.log(`✅ Success! Updated ${result.modifiedCount} notifications.`);
    console.log("Now refresh your dashboard and click the notification bell to see them! 🚀");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

fixNotifications();
