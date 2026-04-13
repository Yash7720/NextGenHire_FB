const mongoose = require("mongoose");
require("dotenv").config();

async function promoteAdmins() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const User = mongoose.model("User", new mongoose.Schema({
    role: String
  }), "users");

  const result = await User.updateMany({}, { $set: { role: "admin" } });
  console.log(`Successfully updated ${result.modifiedCount} users to 'admin' role.`);

  process.exit(0);
}

promoteAdmins().catch(err => {
  console.error(err);
  process.exit(1);
});
