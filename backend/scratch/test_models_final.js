require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // ListModels is not easily available in the high-level SDK without a client.
  // But we can try the most likely models.
  const tests = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro"];
  
  for (const modelName of tests) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("hi");
      console.log(`✅ ${modelName}: SUCCESS`);
      process.exit(0);
    } catch (err) {
      console.log(`❌ ${modelName}: ${err.message}`);
    }
  }
}
run();
