const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function updatePassword() {
  await mongoose.connect(process.env.MONGO_URI);
  const email = 'john@gmail.com';
  const password = 'Admin@123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await User.findOneAndUpdate({ email }, { password: hashedPassword, role: 'admin' });
  console.log(`Password for ${email} updated to ${password} and role set to admin`);
  process.exit();
}

updatePassword();
