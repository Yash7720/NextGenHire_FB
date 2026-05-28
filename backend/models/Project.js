const mongoose = require("mongoose");
require("./User"); // Ensure User model is registered for populate

/**
 * Project — stores a student's project submission.
 * This model matches the new GridFS requirements:
 * studentId, projectTitle, description, techStack, fileId, filename, fileSize, uploadedAt.
 */
const ProjectSchema = new mongoose.Schema(
  {
    // studentId — Reference to the User or Admin who submitted
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'studentModel' // Dynamic reference based on studentModel field
    },
    studentModel: {
      type: String,
      required: true,
      enum: ['User', 'Admin'],
      default: 'User'
    },

    // Metadata
    projectTitle: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    techStack: {
      type: [String], // Array of strings (e.g. ["React", "Node.js"])
      default: [],
    },

    // GridFS File Info (optional for backward compatibility)
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    filename: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number, // in bytes
      default: 0,
    },

    // Navigation Context (kept to link with the course platform)
    courseId: {
      type: String,
      required: true,
    },

    // Optional LIVE Preview URL (e.g. hosted on Vercel/Netlify)
    liveLink: {
      type: String,
      trim: true,
    },

    // Mandatory GitHub Repository URL
    githubLink: {
      type: String,
      required: true,
      trim: true,
    },

    // Backward compatibility field (will store placeholder if needed)
    zipFile: {
      type: String,
    }
  },
  {
    // uploadedAt (auto-managed by timestamps: true)
    timestamps: { createdAt: "uploadedAt", updatedAt: "updatedAt" },
  }
);

module.exports = mongoose.model("Project", ProjectSchema, "projects");

// Add error handling for application routes - update 4

// Refactor prompt generation for Gemini API - update 9

// Refactor controller logic for scalability - update 14

// Optimize AI fallback responses - update 19

// Update project submission endpoints - update 24

// Implement AI chatbot logic - update 29

// Update application models and schemas - update 34

// Add error handling for application routes - update 39
