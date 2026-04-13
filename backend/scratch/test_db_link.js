const mongoose = require("mongoose");
require("dotenv").config();

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const Project = mongoose.model("Project", new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  }), "projects");
  
  const User = mongoose.model("User", new mongoose.Schema({
    name: String,
    email: String
  }), "users");

  const projects = await Project.find().lean();
  console.log(`Found ${projects.length} projects.`);

  for (const p of projects) {
    console.log(`Project: ${p.projectTitle}, studentId: ${p.studentId}`);
    if (p.studentId) {
      const user = await User.findById(p.studentId).lean();
      if (user) {
        console.log(`  -> User found: ${user.name} (${user.email})`);
      } else {
        console.log(`  -> User NOT found for ID: ${p.studentId}`);
      }
    }
  }

  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
