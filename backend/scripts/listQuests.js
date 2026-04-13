const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Quest = require("../models/Quest");

async function listQuests() {
  try {
    console.log(`MONGO_URI from .env: ${process.env.MONGO_URI ? "LOADED" : "MISSING"}`);
    if (!process.env.MONGO_URI) {
      console.error("No MONGO_URI found in .env file!");
      process.exit(1);
    }
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected successfully.");

    const quests = await Quest.find({});
    console.log(`Found ${quests.length} quests in DB.`);
    quests.forEach(q => console.log(`- ${q.title} (${q.type})`));

    process.exit(0);
  } catch (err) {
    console.error("Error listing quests:", err.message);
    process.exit(1);
  }
}

listQuests();
