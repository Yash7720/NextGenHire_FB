require('dotenv').config();
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const fixes = [
      { from: 'C++ Basics', to: 'CPP Basics' },
      { from: 'OOP in C++', to: 'OOP in CPP' },
    ];
    for (const fix of fixes) {
      const r = await Lesson.updateMany(
        { course: 'cpp', chapter: fix.from },
        { $set: { chapter: fix.to } }
      );
      console.log(`"${fix.from}" -> "${fix.to}": ${r.modifiedCount} updated`);
    }
    const chapters = await Lesson.distinct('chapter', { course: 'cpp' });
    console.log('\nCPP chapters now:', chapters);
  })
  .catch(console.error)
  .finally(() => process.exit());
