require('dotenv').config();
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    // Show all C++ lessons to find duplicates
    const cppLessons = await Lesson.find({ course: 'cpp' }).sort({ chapter: 1, title: 1 });
    console.log('All C++ lessons:');
    cppLessons.forEach(l => console.log(`  [${l._id}] chapter="${l.chapter}" title="${l.title}"`));
    console.log(`\nTotal: ${cppLessons.length}`);

    // Find duplicates: same course+chapter+title, keep the first, delete the rest
    const seen = new Map();
    const toDelete = [];
    for (const lesson of cppLessons) {
      const key = `${lesson.course}||${lesson.chapter}||${lesson.title}`;
      if (seen.has(key)) {
        toDelete.push(lesson._id);
      } else {
        seen.set(key, lesson._id);
      }
    }

    if (toDelete.length > 0) {
      console.log(`\nDeleting ${toDelete.length} duplicate C++ lessons...`);
      const result = await Lesson.deleteMany({ _id: { $in: toDelete } });
      console.log(`Deleted: ${result.deletedCount}`);
    }

    // Also fix HTML (has 16 instead of 15 - 1 duplicate)
    const htmlLessons = await Lesson.find({ course: 'html' }).sort({ chapter: 1, title: 1 });
    const seenHtml = new Map();
    const toDeleteHtml = [];
    for (const lesson of htmlLessons) {
      const key = `${lesson.course}||${lesson.chapter}||${lesson.title}`;
      if (seenHtml.has(key)) {
        toDeleteHtml.push(lesson._id);
      } else {
        seenHtml.set(key, lesson._id);
      }
    }
    if (toDeleteHtml.length > 0) {
      console.log(`\nDeleting ${toDeleteHtml.length} duplicate HTML lessons...`);
      await Lesson.deleteMany({ _id: { $in: toDeleteHtml } });
    }

    // Final count
    const final = await Lesson.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.log('\n=== Final count ===');
    final.forEach(g => console.log(`  ${g._id}: ${g.count} lessons`));
  })
  .catch(console.error)
  .finally(() => process.exit());
