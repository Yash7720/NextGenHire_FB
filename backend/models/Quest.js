const mongoose = require("mongoose");

const questSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Make optional for existing global templates if needed
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    desc: { // Matches user's screenshot
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "🎯",
    },
    type: {
      type: String,
      enum: ["daily", "weekly", "lesson", "quiz", "streak", "time", "application"], // Expanded to match user's "daily"/"weekly"
      required: true,
    },
    rarity: { // Matches user's screenshot
      type: String,
      default: "common",
    },
    progress: {
      type: Number,
      default: 0,
    },
    max: { // Matches user's screenshot
      type: Number,
      required: true,
    },
    xp: { // Matches user's screenshot
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "claimed"],
      default: "pending",
    },
    date: {
      type: String,
      index: true,
    },
  },
  { timestamps: true, collection: "quests" }
);

questSchema.index({ userId: 1, date: 1, type: 1 });

module.exports = mongoose.model("Quest", questSchema);