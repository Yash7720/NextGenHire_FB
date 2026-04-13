require("dotenv").config();
const mongoose = require("mongoose");
const Lesson = require("./models/Lesson");

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const lessons = await Lesson.find().lean();
    console.log(JSON.stringify(lessons, null, 2));
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
