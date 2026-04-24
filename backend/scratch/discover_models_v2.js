require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const models = ["models/gemini-1.5-flash", "models/gemini-pro"];
  
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      await model.generateContent("hi");
      console.log(`✅ ${m}`);
    } catch (err) {
      console.log(`❌ ${m}: ${err.message}`);
    }
  }
}
listModels();
