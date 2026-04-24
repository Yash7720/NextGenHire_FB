require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // There isn't a direct listModels in the main SDK class usually, 
    // but we can try a dummy request to see what's supported or check the docs.
    // However, we can try to initialize common ones and see which one doesn't 404.
    
    const models = ["gemini-pro", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
    console.log("Checking model availability for your API key...");

    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        await model.generateContent("test");
        console.log(`✅ [AVAILABLE]: ${m}`);
      } catch (err) {
        if (err.status === 404) {
           console.log(`❌ [NOT FOUND]: ${m}`);
        } else {
           console.log(`⚠️ [OTHER ERROR] ${m}: ${err.message}`);
        }
      }
    }
  } catch (err) {
    console.error("Discovery failed:", err.message);
  }
}

listModels();
