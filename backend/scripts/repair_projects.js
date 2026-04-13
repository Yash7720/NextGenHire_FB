const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const Project = mongoose.connection.db.collection('projects');
    
    // Find projects where studentId is missing or is just a string
    const projects = await Project.find({}).toArray();
    let fixedCount = 0;

    for (const p of projects) {
      const update = {};
      
      // Fix studentId
      if (!p.studentId && p.userId) {
        update.studentId = new mongoose.Types.ObjectId(p.userId);
      }
      
      // Fix missing metadata
      if (!p.projectTitle) update.projectTitle = 'Legacy Project';
      if (!p.description)  update.description  = 'Migrated from old submission system';
      if (!p.techStack)    update.techStack    = [];

      if (Object.keys(update).length > 0) {
        await Project.updateOne({ _id: p._id }, { $set: update });
        fixedCount++;
      }
    }

    console.log(`Migration complete. Fixed ${fixedCount} records.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();
