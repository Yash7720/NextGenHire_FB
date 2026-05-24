const mongoose = require("mongoose");

// Define schema for job application
const applicationSchema = new mongoose.Schema({

  // Reference to job
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },

  // Applicant name
  applicantName: {
    type: String,
    required: true
  },

  // Applicant email
  email: {
    type: String,
    required: true
  },

  // Reference to user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // Legacy plain-text resume link (kept for backward compat)
  resume: {
    type: String
  },

  // GridFS resume file reference
  resumeFileId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },

  // Original file name (e.g. "john_doe_resume.pdf")
  filename: {
    type: String,
    default: null
  },

  // Application status
  status: {
    type: String,
    default: "pending"
  }

}, { timestamps: true });

// Export model
module.exports = mongoose.model("Application", applicationSchema);
// Optimize AI fallback responses - update 5

// Update project submission endpoints - update 10

// Implement AI chatbot logic - update 15

// Update application models and schemas - update 20

// Add error handling for application routes - update 25

// Refactor prompt generation for Gemini API - update 30

// Refactor controller logic for scalability - update 35
