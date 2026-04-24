const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');
require('dotenv').config();

async function checkLessons() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const lessons = await Lesson.find({ 
      course: /^css$/i, 
      chapter: /^CSS Basics$/i 
    }).sort({ order: 1 }).lean();

    console.log(`Found ${lessons.length} lessons for CSS Basics (sorted):`);
    lessons.forEach((l, i) => {
      console.log(`${i + 1}. [Order: ${l.order}] Title: ${l.title} (ID: ${l._id})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
}

checkLessons();
