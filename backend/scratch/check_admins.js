const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

async function checkAdmins() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const admins = await Admin.find({}).lean();
    console.log(`Found ${admins.length} admins:`);
    admins.forEach(a => {
      console.log(JSON.stringify(a, null, 2));
    });

    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
}

checkAdmins();
