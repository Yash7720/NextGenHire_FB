require('dotenv').config();
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const grouped = await Lesson.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 }, chapters: { $addToSet: '$chapter' } } },
      { $sort: { _id: 1 } }
    ]);
    console.log('Lessons by course:');
    grouped.forEach(g => {
      console.log(`  ${g._id}: ${g.count} lessons, chapters: ${JSON.stringify(g.chapters)}`);
    });
  })
  .catch(console.error)
  .finally(() => process.exit());
