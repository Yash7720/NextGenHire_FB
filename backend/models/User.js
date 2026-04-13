const mongoose = require("mongoose");

// ─── Sub-schemas ──────────────────────────────────────────────────────────────
const SkillSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true },
    score: { type: Number, default: 0, min: 0, max: 100 },
    color: { type: String, default: "#00f5ff" },
  },
  { _id: false }
);

const XpEntrySchema = new mongoose.Schema(
  {
    month: { type: String, required: true }, // e.g. "Jan", "Feb"
    year:  { type: Number, required: true }, // e.g. 2025
    xp:    { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

// ─── Schema ──────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function() { return !this.firebaseUid; }, // Required only if not a social login
    },
    
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true, // Allows nulls for non-social users while keeping uniqueness for others
    },

    role: {
      type: String,
      enum: ["student", "recruiter", "admin"],
      default: "student",
    },

    // ── Profile fields ────────────────────────────────────────────────────────
    /** Short bio shown on the profile card */
    bio: {
      type: String,
      default: "",
      maxlength: 300,
    },

    /** User's age */
    age: {
      type: Number,
      default: null,
      min: 10,
      max: 100,
    },

    /** User's degree / education (e.g. "B.Tech CS") */
    degree: {
      type: String,
      default: "",
      trim: true,
    },

    /** Avatar — emoji string or image URL */
    avatar: {
      type: String,
      default: "⭐",
    },
    
    /** Profile Picture URL for social login */
    profilePic: {
      type: String,
      default: "",
    },

    /** Per-user skill assessments */
    skills: {
      type: [SkillSchema],
      default: [],
    },

    /** Monthly XP history for the analytics chart */
    xpHistory: {
      type: [XpEntrySchema],
      default: [],
    },

    /** Achievement badge IDs earned by the user */
    earnedBadges: {
      type: [String],
      default: [],
    },

    /** Job IDs the user has applied to */
    appliedJobs: {
      type: [String],
      default: [],
    },

    /** Admin-managed recruitment status for this candidate */
    candidateStatus: {
      type: String,
      enum: ["pending", "shortlisted", "interview", "rejected"],
      default: "pending",
    },

    /** Courses the user is currently taking (IDs from COURSES data) */
    enrolledCourses: {
      type: [String],
      default: [],
    },


    // ── Leaderboard fields ────────────────────────────────────────────────────
    /** Total experience points earned by this user */
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },

    /** Number of days the user has logged in consecutively */
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },

    /** Number of courses the user has fully completed (quiz + project) */
    coursesCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },

    /** Last date the user claimed their daily login bonus (for streak logic) */
    lastLoginDate: {
      type: Date,
      default: null,
    },

    /** Token for password reset */
    resetPasswordToken: {
      type: String,
      default: null,
    },

    /** Expiry date for password reset token */
    resetPasswordExpire: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,  // adds createdAt & updatedAt automatically

    // Expose virtual fields when converting to JSON / plain object
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: composite leaderboard score ────────────────────────────────────
// score = xp × 1  +  coursesCompleted × 200  +  streak × 50
// This matches the formula used in the leaderboard controller.
UserSchema.virtual("score").get(function () {
  return (
    (this.xp               || 0) * 1   +
    (this.coursesCompleted  || 0) * 200 +
    (this.streak            || 0) * 50
  );
});

// ─── Index: speeds up sort-by-xp queries ─────────────────────────────────────
UserSchema.index({ xp: -1 });

module.exports = mongoose.model("User", UserSchema, "users");