const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Project = require('../models/Project');
require('dotenv').config();

async function fixAdminIds() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Currently known mapping (from previous research)
    const mapping = [
      { email: 'john@gmail.com', originalId: '69da1f751b3c12c4cf0bcfd9' },
      { email: 'ajay@gmail.com', originalId: '69da2e431b3c12c4cf0bd75d' },
      { email: 'rocky@gmail.com', originalId: '69da82d206bf804e463a16a2' } // Found this ID in previous logs for Rocky
    ];

    for (const m of mapping) {
      const current = await Admin.findOne({ email: m.email });
      if (current && current._id.toString() !== m.originalId) {
        console.log(`Fixing ID for ${m.email}: ${current._id} -> ${m.originalId}`);
        
        // Remove current
        await Admin.deleteOne({ _id: current._id });

        // Create new with original ID
        const adminData = current.toObject();
        delete adminData._id;
        
        const newAdmin = new Admin({
          _id: new mongoose.Types.ObjectId(m.originalId),
          ...adminData
        });
        await newAdmin.save();
        console.log(`Restored ID for ${m.email}`);
      } else if (!current) {
        console.log(`Admin ${m.email} not found. Skipping.`);
      } else {
        console.log(`Admin ${m.email} already has correct ID.`);
      }
    }

    console.log('ID restoration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Fix failed:', err);
    process.exit(1);
  }
}

fixAdminIds();
