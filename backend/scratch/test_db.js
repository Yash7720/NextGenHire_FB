const mongoose = require("mongoose");
require("dotenv").config();

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));

  const Project = mongoose.model("Project", new mongoose.Schema({}), "projects");
  const count = await Project.countDocuments();
  console.log("Count in 'projects' collection:", count);

  const ProjectSingular = mongoose.model("ProjectSingular", new mongoose.Schema({}), "project");
  const countSingular = await ProjectSingular.countDocuments();
  console.log("Count in 'project' collection:", countSingular);

  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
