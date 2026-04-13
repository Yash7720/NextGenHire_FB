const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "admin" },
    avatar: { type: String, default: "⭐" },
    permissions: [{ type: String }], // Optional: for different admin levels
    lastLogin: { type: Date }
  },
  { 
    timestamps: true,
    collection: 'admin' // Explicitly set collection name as requested
  }
);

module.exports = mongoose.model("Admin", adminSchema);
