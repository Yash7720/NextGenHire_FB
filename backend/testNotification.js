require("dotenv").config();
const mongoose = require("mongoose");
const Notification = require("./models/Notification");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    // Find the first user in the databse to send a notification to
    const user = await User.findOne();
    if (!user) {
      console.log("No users found. Please create an account first!");
      process.exit();
    }

    // Create a robust notification 
    await Notification.create({
      userId: user._id,
      text: "🎉 Congratulations! A recruiter has reviewed your application for Frontend Developer.",
      type: "job",
      unread: true
    });

    console.log(`Successfully sent backend notification to ${user.name} (${user.email}).`);
    console.log("Wait up to 10 seconds and you will see the bell icon on the frontend update dynamically!");
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
