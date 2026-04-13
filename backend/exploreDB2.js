const mongoose = require("mongoose");
const Lesson = require("./models/Lesson");
const fs = require('fs');
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const courses = await Lesson.distinct("course");
    const chapters = await Lesson.distinct("chapter");
    
    // Check for JavaScript specifically
    const jsLessons = await Lesson.find({ 
      course: { $in: [/js/i, /javascript/i] } 
    }).limit(20);
    
    // Check for ES6+ specifically
    const es6Lessons = await Lesson.find({
        chapter: /ES6/i
    });

    const report = {
        courses,
        chaptersCount: chapters.length,
        jsLessonsCount: await Lesson.countDocuments({ course: { $in: [/js/i, /javascript/i] } }),
        jsSamples: jsLessons.map(l => ({ course: l.course, chapter: l.chapter, title: l.title })),
        es6Lessons: es6Lessons.map(l => ({ course: l.course, chapter: l.chapter, title: l.title }))
    };

    fs.writeFileSync('db_report.json', JSON.stringify(report, null, 2), 'utf8');
    process.exit();
  })
  .catch(err => {
    fs.writeFileSync('db_error.txt', err.toString(), 'utf8');
    process.exit(1);
  });
