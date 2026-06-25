require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    console.log("Using API Key:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent("Say hello");
    console.log("Success:", result.response.text());
  } catch (err) {
    console.error("Full Error Message:", err.message);
    if (err.cause) console.error("Error Cause:", err.cause);
    if (err.stack) console.error("Error Stack:", err.stack);
  }
}

test();
