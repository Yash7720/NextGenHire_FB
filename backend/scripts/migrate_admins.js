const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');
require('dotenv').config();

async function migrateAdmins() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const adminUsers = await User.find({ role: 'admin' });
    console.log(`Found ${adminUsers.length} admins in users collection.`);

    for (const u of adminUsers) {
      const emailExists = await Admin.findOne({ email: u.email });
      if (!emailExists) {
        await Admin.create({
          name: u.name,
          email: u.email,
          password: u.password,
          role: 'admin',
          avatar: u.avatar || '⭐',
          createdAt: u.createdAt,
          updatedAt: u.updatedAt
        });
        console.log(`Migrated: ${u.email}`);
      } else {
        console.log(`Already exists in admin collection: ${u.email}`);
      }
    }

    // Optional: Remove them from users collection
    const result = await User.deleteMany({ role: 'admin' });
    console.log(`Removed ${result.deletedCount} admins from the regular users collection.`);

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateAdmins();
