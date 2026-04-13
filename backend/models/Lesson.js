const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({

  course: String,
  chapter: String,
  title: String,
  content: String,
  example: String,
  output: String,
  tips: String,
  duration: String

});

module.exports = mongoose.model("Lesson", lessonSchema);