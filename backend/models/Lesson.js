const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({

  course: String,
  chapter: String,
  title: String,
  content: String,
  example: String,
  output: String,
  tips: String,
  duration: String,
  order: { type: Number, default: 0 }
});

module.exports = mongoose.model("Lesson", lessonSchema);