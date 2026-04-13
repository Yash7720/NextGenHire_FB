const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Quest = require("../models/Quest");

async function debugQuests() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("MONGO_URI is missing in .env");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.\n");

    const quests = await Quest.find({});
    console.log(`Found ${quests.length} quests in the database:`);
    
    quests.forEach((q, i) => {
      console.log(`${i+1}. [${q.status}] ${q.title}`);
      console.log(`   Type: ${q.type} | Progress: ${q.progress}/${q.max} | XP: ${q.xp}`);
      console.log(`   UserId: ${q.userId || "NULL (Global)"}`);
      console.log("   ------------------------------------------------");
    });

    process.exit(0);
  } catch (err) {
    console.error("Error debugging quests:", err.message);
    process.exit(1);
  }
}

debugQuests();
