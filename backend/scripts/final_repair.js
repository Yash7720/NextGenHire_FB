const mongoose = require('mongoose');
require('dotenv').config();

async function repair() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    const Project = mongoose.connection.db.collection('projects');
    const projects = await Project.find({}).toArray();
    let count = 0;

    for (const p of projects) {
      const update = {};
      
      // 1. Move userId -> studentId as ObjectId
      if (!p.studentId && p.userId) {
        update.studentId = new mongoose.Types.ObjectId(p.userId);
      } else if (typeof p.studentId === 'string') {
        update.studentId = new mongoose.Types.ObjectId(p.studentId);
      }

      // 2. Add placeholders if missing
      if (!p.projectTitle || p.projectTitle === 'Legacy Project') {
        update.projectTitle = 'Portfolio Submission';
      }
      if (!p.description || p.description === 'Migrated from old submission system') {
        update.description = 'A project submission verifying course completion.';
      }
      if (!p.techStack || p.techStack.length === 0) {
        update.techStack = ['MERN Stack', 'Development'];
      }

      if (Object.keys(update).length > 0) {
        await Project.updateOne({ _id: p._id }, { $set: update });
        count++;
      }
    }

    console.log(`Successfully repaired ${count} records.`);
    process.exit(0);
  } catch (err) {
    console.error('Repair failed:', err.message);
    process.exit(1);
  }
}

repair();
