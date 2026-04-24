const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({ role: 'student' }).limit(10);
    console.log(`Found ${users.length} students:`);
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) [ID: ${u._id}]`);
    });

    process.exit(0);
  } catch (err) {
    console.error('List failed:', err);
    process.exit(1);
  }
}

listUsers();
