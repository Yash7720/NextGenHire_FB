require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Try v1 explicitly
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
    const result = await model.generateContent("hi");
    console.log("✅ SUCCESS with v1!");
    process.exit(0);
  } catch (err) {
    console.log("❌ FAIL with v1:", err.message);
  }
}
run();
