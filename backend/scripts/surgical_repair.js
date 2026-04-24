const mongoose = require('mongoose');
require('dotenv').config();

async function surgicalRepair() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      family: 4
    });
    
    const Project = mongoose.connection.db.collection('projects');
    const User = mongoose.connection.db.collection('users');

    // 1. Fix John Wick's project (69da2a381b3c12c4cf0bd491)
    // Already has studentId but checking type.
    const p1 = await Project.findOne({ _id: new mongoose.Types.ObjectId('69da2a381b3c12c4cf0bd491') });
    if (p1 && typeof p1.studentId === 'string') {
        await Project.updateOne({ _id: p1._id }, { $set: { studentId: new mongoose.Types.ObjectId(p1.studentId) } });
    }

    // 2. Fix Ajay's project (69da2f1e1b3c12c4cf0bd859)
    const ajay = await User.findOne({ name: /Ajay/i });
    if (ajay) {
        await Project.updateOne(
            { _id: new mongoose.Types.ObjectId('69da2f1e1b3c12c4cf0bd859') },
            { 
              $set: { 
                studentId: ajay._id,
                projectTitle: 'Gym Website',
                description: 'Real-time gym management portal',
                techStack: ['React', 'Node.js', 'Socket.io']
              } 
            }
        );
        console.log('Fixed Ajay project.');
    }

    console.log('Surgical repair complete.');
    process.exit(0);
  } catch (err) {
    console.error('Repair failed:', err.message);
    process.exit(1);
  }
}

surgicalRepair();
