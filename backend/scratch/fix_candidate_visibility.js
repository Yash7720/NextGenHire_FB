const mongoose = require("mongoose");
require("dotenv").config();

async function fixRoles() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const User = mongoose.model("User", new mongoose.Schema({
    role: String,
    email: String
  }), "users");

  // Make John the admin
  await User.updateOne({ email: "john@gmail.com" }, { $set: { role: "admin" } });
  
  // Make everyone else a student
  await User.updateMany({ email: { $ne: "john@gmail.com" } }, { $set: { role: "student" } });
  
  console.log("Roles adjusted: John is Admin, others are Students.");
  process.exit(0);
}

fixRoles().catch(err => {
  console.error(err);
  process.exit(1);
});
