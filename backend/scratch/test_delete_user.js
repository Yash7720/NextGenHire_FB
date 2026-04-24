const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const Quest = require('../models/Quest');
require('dotenv').config();

async function testDeleteUser(email) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      process.exit(0);
    }

    const userId = user._id;
    console.log(`Attempting to delete user ${email} (ID: ${userId})`);

    const results = await Promise.all([
      User.findByIdAndDelete(userId),
      Application.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      Project.deleteMany({ userId }),
      Quest.deleteMany({ userId }),
    ]);

    console.log('Results:', {
      userDeleted: !!results[0],
      applications: results[1]?.deletedCount,
      notifications: results[2]?.deletedCount,
      projects: results[3]?.deletedCount,
      quests: results[4]?.deletedCount
    });

    process.exit(0);
  } catch (err) {
    console.error('Delete failed:', err);
    process.exit(1);
  }
}

testDeleteUser('user_test@gmail.com');
