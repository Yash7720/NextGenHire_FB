require('dotenv').config();
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    // Show all HTML lessons grouped by title to find the duplicate
    const all = await Lesson.find({ course: 'html' }).sort({ chapter: 1, title: 1 });
    console.log('All HTML lessons:');
    all.forEach(l => console.log(`  [${l._id}] "${l.title}" | chapter: "${l.chapter}"`));

    // Find duplicates by title
    const seen = new Map();
    const toDelete = [];
    for (const l of all) {
      if (seen.has(l.title)) {
        // Keep the one with more content
        const prev = seen.get(l.title);
        const prevScore = (prev.content||'').length + (prev.example||'').length;
        const curScore  = (l.content||'').length   + (l.example||'').length;
        if (curScore > prevScore) {
          toDelete.push(prev._id);
          seen.set(l.title, l);
        } else {
          toDelete.push(l._id);
        }
      } else {
        seen.set(l.title, l);
      }
    }

    if (toDelete.length > 0) {
      await Lesson.deleteMany({ _id: { $in: toDelete } });
      console.log(`\nDeleted ${toDelete.length} weaker duplicate(s).`);
    } else {
      console.log('\nNo duplicates found by title!');
    }

    const count = await Lesson.countDocuments({ course: 'html' });
    console.log(`HTML lessons now: ${count}`);
  })
  .catch(console.error)
  .finally(() => process.exit());
