const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "REPLACE_WITH_YOUR_KEY");
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  systemInstruction: "You are the NextGenHire AI Assistant. Your role is to help users with their career, courses, XP, levels, and job applications within the NextGenHire platform. ONLY answer questions related to NextGenHire, professional development, and the platform's features (Strobes/XP, Quests, Courses). If a user asks a question outside of these topics (like cooking, entertainment, or general trivia), politely explain that you are specialized in NextGenHire and career guidance, and redirect them to platform features. Be professional, encouraging, and concise. Use markdown for lists and bold text."
});

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "REPLACE_WITH_YOUR_KEY") {
        console.warn("[chatbot] No GEMINI_API_KEY found in .env. Returning dummy response.");
        return res.json({ reply: "I'm sorry, my AI brain isn't fully connected yet. Please add a GEMINI_API_KEY to the backend .env file to activate me!" });
    }

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: message }]
        }
      ]
    });

    const reply = result.response.text();

    console.log("[chatbot] Success sending response!");
    res.json({ reply });
  } catch (error) {
    console.error("[chatbot] Gemini error:", error);
    res.status(500).json({ error: "Gemini error. Please check your API key and network." });
  }
});

module.exports = router;
