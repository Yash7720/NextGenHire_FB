const mongoose = require('mongoose');
require('dotenv').config();

const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

const cleanup = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        console.log('1. Deleting all Applications...');
        const deleteApps = await Application.deleteMany({});
        console.log(`Deleted ${deleteApps.deletedCount} applications.`);

        console.log('2. Resetting Job applicant counts to 0...');
        const updateJobs = await Job.updateMany({}, { $set: { applicants: 0 } });
        console.log(`Updated ${updateJobs.modifiedCount} jobs.`);

        console.log('3. Clearing User appliedJobs arrays...');
        const updateUsers = await User.updateMany({}, { $set: { appliedJobs: [] } });
        console.log(`Updated ${updateUsers.modifiedCount} users.`);

        console.log('4. Triggering real-time update emission (optional simulation)...');
        // Since we are running outside the main server, we can't easily emit socket events 
        // unless we join the same logic, but the next page load or polling will show 0.

        console.log('Cleanup complete successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Cleanup failed:', err);
        process.exit(1);
    }
};

cleanup();
