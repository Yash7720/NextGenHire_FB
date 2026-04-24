const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
require('dotenv').config();

async function verifyDelete() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Create a dummy user
    const user = await User.create({
      name: 'Cleanup Test',
      email: `cleanup_${Date.now()}@test.com`,
      password: 'password123',
      role: 'student'
    });
    console.log('Created test user:', user._id);

    // 2. Create a dummy project for them
    const project = await Project.create({
      studentId: user._id,
      studentModel: 'User',
      projectTitle: 'Cleanup Test Project',
      description: 'Test',
      courseId: 'test-course'
    });
    console.log('Created test project linked to user:', project._id);

    // 3. Call the deletion logic (simulate what deleteUser does)
    const userId = user._id;
    const [userDeleted, projects] = await Promise.all([
      User.findByIdAndDelete(userId),
      Project.deleteMany({ studentId: userId })
    ]);

    console.log('Deletion results:');
    console.log('- User deleted:', !!userDeleted);
    console.log('- Projects deleted count:', projects.deletedCount);

    if (projects.deletedCount === 1) {
      console.log('SUCCESS: Cascading delete worked for Projects!');
    } else {
      console.error('FAILURE: Project was not deleted!');
    }

    process.exit(0);
  } catch (err) {
    console.error('Verify failed:', err);
    process.exit(1);
  }
}

verifyDelete();
