const express = require("express");
const router = express.Router();

const { createJob, getJobs } = require("../controllers/jobController");

router.post("/create", createJob);
router.get("/", getJobs);
module.exports = router;