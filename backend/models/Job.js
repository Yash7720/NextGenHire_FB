const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  salary: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  // Optional fields used by the existing frontend UI
  type: {
    type: String,
    default: "Full-time"
  },
  level: {
    type: String,
    default: "Mid"
  },
  skills: {
    type: [String],
    default: []
  },
  deadline: {
    type: String,
    default: ""
  },
  applicants: {
    type: Number,
    default: 0
  },
  logo: {
    type: String,
    default: "🏢"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Job", jobSchema);