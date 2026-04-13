const express = require("express");
const router = express.Router();

const Lesson = require("../models/Lesson");

const lessonController = require("../controllers/lessonController");

router.get("/:title", async (req,res)=>{

  try{

    const lesson = await Lesson.findOne({ title:req.params.title })

    res.json(lesson)

  }catch(err){

    res.status(500).json(err)

  }

})

router.get("/:course/:chapter", lessonController.getLessonsByCourseAndChapter);

module.exports = router