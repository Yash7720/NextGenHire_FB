const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Quest = require("../models/Quest");

async function countQuests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const count = await Quest.countDocuments({});
    console.log(`COUNT_RESULT: ${count}`);
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}

countQuests();
