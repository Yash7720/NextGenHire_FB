const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Quest = require("../models/Quest");

async function removeDummyQuests() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    const titlesToRemove = [
      "Scholar's Path",
      "Reliable Warrior",
      "Brainiac"
    ];

    console.log(`Searching for quests with titles: ${titlesToRemove.join(", ")}`);

    const result = await Quest.deleteMany({
      title: { $in: titlesToRemove }
    });

    console.log(`Successfully deleted ${result.deletedCount} dummy quests.`);

    process.exit(0);
  } catch (err) {
    console.error("Error removing dummy quests:", err.message);
    process.exit(1);
  }
}

removeDummyQuests();
