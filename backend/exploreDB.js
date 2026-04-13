const mongoose = require("mongoose");
const Lesson = require("./models/Lesson");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Exploring database...");
    
    // Get all courses present in the collection
    const courses = await Lesson.distinct("course");
    console.log("Courses found:", courses);
    
    // Search for any JavaScript related lessons
    const jsLessons = await Lesson.find({ 
      course: { $in: [/js/i, /javascript/i] } 
    }).limit(10);
    
    console.log("Sample JS Lessons:", JSON.stringify(jsLessons, null, 2));
    
    // Specifically check for Chapter 5
    const results = await Lesson.find({
        chapter: /ES6/i
    });
    console.log("Lessons matching 'ES6':", results.length);
    if(results.length > 0) {
        console.log("First match chapter:", results[0].chapter);
        console.log("First match course:", results[0].course);
    }

    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
