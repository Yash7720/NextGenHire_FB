const mongoose = require("mongoose");
require("dotenv").config();

async function checkAdmins() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const User = mongoose.model("User", new mongoose.Schema({
    name: String,
    email: String,
    role: String
  }), "users");

  const admins = await User.find({ role: "admin" }).lean();
  console.log(`Found ${admins.length} admins:`);
  admins.forEach(a => console.log(` - ${a.name} (${a.email}) [role: ${a.role}]`));

  const allUsers = await User.find().lean();
  console.log(`\nTotal users in DB: ${allUsers.length}`);
  if (allUsers.length > 0 && admins.length === 0) {
    console.log("WARNING: No users have the 'admin' role!");
    console.log("Sample users:");
    allUsers.slice(0, 5).forEach(u => console.log(` - ${u.name} (${u.role})`));
  }

  process.exit(0);
}

checkAdmins().catch(err => {
  console.error(err);
  process.exit(1);
});
