 const Lesson = require("../models/Lesson");

// Get lesson by title
exports.getLesson = async (req, res) => {

  try {

    const lesson = await Lesson.findOne({ title: req.params.title });

    res.json(lesson);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};

// Get lessons by course and chapter
exports.getLessonsByCourseAndChapter = async (req, res) => {
  try {
    const { course, chapter } = req.params;
    
    // Escape regex special characters from input strings
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Perform case-insensitive search with escaped characters
    const lessons = await Lesson.find({ 
      course: new RegExp(`^${escapeRegex(course)}$`, 'i'), 
      chapter: new RegExp(`^${escapeRegex(chapter)}$`, 'i') 
    }).sort({ order: 1 });
    
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};