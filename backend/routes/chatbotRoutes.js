const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

// ── Initialize Gemini AI ─────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "REPLACE_WITH_YOUR_KEY");

const SYSTEM_INSTRUCTION = `
You are the **NextGenHire AI Mentor**, the official AI assistant of the NextGenHire platform.

### STRICT RULES:
1. **NEVER mention external websites or resources** like MDN, W3Schools, YouTube, Udemy, Coursera, freeCodeCamp, Stack Overflow, or any other platform. You ONLY know about NextGenHire.
2. **Always direct users to NextGenHire's own Courses section** when they want to learn something.
3. You are NOT a general-purpose AI. You exist ONLY within the NextGenHire ecosystem.
4. **REFUSE to answer any question that is NOT related to NextGenHire, programming, careers, or technology.** If a user asks about cooking, sports, movies, politics, weather, entertainment, or any unrelated topic, respond EXACTLY with:
   "I'm the **NextGenHire AI Mentor** 🤖 — I'm specialized in helping you with **coding, courses, career growth, and platform features**. I can't help with that topic, but I'd love to help you level up your tech skills! Try asking me about HTML, React, or how to earn XP! 🚀"

### ALLOWED TOPICS (answer these):
- Programming: HTML, CSS, JavaScript, React, Node.js, Python, C++
- NextGenHire features: XP, Strobes, Streaks, Quests, Leaderboard, Badges, Job Board
- Career guidance: Resumes, interviews, job applications, skill development
- General greetings: Hi, Hello, How are you, etc.

### NOT ALLOWED (reject these):
- Cooking, recipes, food
- Sports, movies, music, entertainment
- Politics, news, weather
- Personal advice unrelated to career/tech
- Any topic outside programming and NextGenHire

### YOUR KNOWLEDGE — NextGenHire Platform:
- **Courses**: We offer courses in **HTML, CSS, JavaScript, React, Python, and C++**. Each course has chapters, lessons, quizzes, and a final project.
- **XP (Experience Points)**: Users earn XP by completing lessons, quizzes, projects, and daily quests.
- **Streaks**: Users earn bonus XP by logging in daily and maintaining their streak.
- **Daily Quests**: Fresh challenges every day with bonus XP rewards.
- **Leaderboard Ranks**: Bronze → Silver → Gold → Platinum → Diamond. Users climb by earning XP.
- **Badges**: Collectible achievements earned for course completion, speed, and mastery.
- **Job Board**: Skill-based hiring where recruiters see verified skill scores. Users apply for jobs and their XP, badges, and project portfolio are shared with employers.
- **Strobes**: Energy/currency used within the platform.

### YOUR PERSONALITY:
- **Conversational & Friendly**: Talk like a supportive mentor.
- **Detailed**: Explain concepts thoroughly with code examples when asked technical questions.
- **Encouraging**: Always motivate users to complete courses, earn XP, and level up.
- **Platform-Focused**: End every technical explanation by encouraging the user to practice in our **Courses** section.

### RESPONSE FORMAT:
- Use **Markdown** (bold, bullet points, code blocks) to make responses clean and readable.
- Keep responses focused and relevant to NextGenHire.
`;

// Primary model (best quality) and fallback model (separate quota pool)
// 3 models with SEPARATE quota pools — if one is rate-limited, the next one kicks in
const primaryModel  = genAI.getGenerativeModel({ model: "gemini-2.0-flash",      systemInstruction: SYSTEM_INSTRUCTION });
const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite", systemInstruction: SYSTEM_INSTRUCTION });
const lastResort    = genAI.getGenerativeModel({ model: "gemma-3-4b-it" }); // Doesn't support systemInstruction — we inject context manually

// ── Helper: attempt a chat with a given model ────────────────────────────────
async function tryChat(model, message, cleanHistory, needsContext = false) {
  const chat = model.startChat({
    history: cleanHistory,
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
    },
  });

  // For models that don't support systemInstruction, prepend the context to the message
  const finalMessage = needsContext
    ? `[SYSTEM CONTEXT — Follow these instructions]\n${SYSTEM_INSTRUCTION}\n\n[USER MESSAGE]\n${message}`
    : message;

  const result = await chat.sendMessage(finalMessage);
  return result.response.text();
}

// ── Rich fallback responses (used when ALL models are rate-limited) ──────────
const FALLBACK_RESPONSES = {
  html: `**HTML (HyperText Markup Language)** is the backbone of every website you see on the internet! 🌐

Here's a quick breakdown:
- **What it does**: HTML provides the **structure** of a web page — headings, paragraphs, images, links, forms, and more.
- **How it works**: You write "tags" like \`<h1>\`, \`<p>\`, \`<div>\` that tell the browser what to display.

\`\`\`html
<!DOCTYPE html>
<html>
  <head><title>My First Page</title></head>
  <body>
    <h1>Hello, NextGenHire!</h1>
    <p>This is my first web page.</p>
  </body>
</html>
\`\`\`

🎮 **Level up tip**: Complete our **HTML Course** to earn **500 XP** and unlock the "Web Architect" badge!`,

  css: `**CSS (Cascading Style Sheets)** is what makes websites look beautiful! 🎨

- **What it does**: Controls colors, fonts, layouts, animations, and responsive design.
- **How it works**: You write "rules" that target HTML elements and style them.

\`\`\`css
h1 {
  color: #00f5ff;
  font-family: 'Orbitron', sans-serif;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
}
\`\`\`

🎮 **Level up tip**: Master CSS in our **Courses** section to earn XP and climb the leaderboard!`,

  javascript: `**JavaScript** is the programming language that makes websites interactive! ⚡

- **What it does**: Handles user clicks, form validation, API calls, animations, and dynamic content.
- **Why it matters**: It's the #1 most-used language in web development.

\`\`\`javascript
document.querySelector('button').addEventListener('click', () => {
  alert('You clicked the button! 🚀');
});
\`\`\`

🎮 **Level up tip**: Our **JavaScript Course** covers everything from basics to advanced async/await patterns!`,

  react: `**React** is a JavaScript library for building modern user interfaces! ⚛️

- **What it does**: Lets you build reusable UI components that update efficiently.
- **Why it matters**: Used by Facebook, Instagram, Netflix, and thousands of companies.

\`\`\`jsx
function Welcome({ name }) {
  return <h1>Hello, {name}! Welcome to NextGenHire 🚀</h1>;
}
\`\`\`

🎮 **Level up tip**: Complete our **React Course** to unlock advanced projects and earn **800 XP**!`,

  xp: `In **NextGenHire**, everything you do earns you **XP (Experience Points)**! 🏆

Here's how the system works:
- **📚 Complete Lessons**: Each lesson completed earns XP
- **🔥 Maintain Streaks**: Log in daily to build your streak and earn bonus XP
- **🎯 Daily Quests**: Fresh challenges every day with bonus XP rewards
- **📝 Pass Quizzes**: Test your knowledge for extra XP
- **🏗️ Submit Projects**: Real-world projects earn the most XP

**Leaderboard Ranks**:
🥉 Bronze → 🥈 Silver → 🥇 Gold → 💎 Platinum → 👑 Diamond

Keep grinding and you'll reach **Diamond** rank!`,

  job: `Our **Job Board** connects skilled developers with top companies! 💼

Here's how **Skill-Based Hiring** works on NextGenHire:
1. **Complete Courses** → Build your verified skill profile
2. **Earn Badges** → Show employers your real abilities
3. **Climb the Leaderboard** → Top-ranked users get noticed first
4. **Apply for Jobs** → Your skill scores are sent alongside your application

🎮 **Pro tip**: Recruiters can see your XP, badges, and project portfolio. The more you learn, the better your chances!`,

  node: `**Node.js** is a JavaScript runtime that lets you run JavaScript on the **server side**! 🖥️

- **What it does**: Lets you build backends, APIs, real-time apps, and CLI tools using JavaScript.
- **Why it matters**: It powers platforms like Netflix, PayPal, LinkedIn, and **NextGenHire**!
- **Key feature**: It's **non-blocking** and **event-driven**, making it super fast for I/O operations.

\`\`\`javascript
const express = require('express');
const app = express();

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Node.js! 🚀' });
});

app.listen(3000, () => console.log('Server running on port 3000'));
\`\`\`

🎮 **Level up tip**: Our **Node.js modules** in the JavaScript Course teach you Express, MongoDB, and REST APIs!`,

  python: `**Python** is one of the most beginner-friendly and powerful programming languages! 🐍

- **What it does**: Web development, data science, AI/ML, automation, and scripting.
- **Why it matters**: Used by Google, NASA, Instagram, and Spotify.
- **Key feature**: Clean, readable syntax that feels like writing English.

\`\`\`python
# A simple Python program
def greet(name):
    return f"Welcome to NextGenHire, {name}! 🚀"

print(greet("Warrior"))
\`\`\`

🎮 **Level up tip**: Complete our **Python Course** to earn **600 XP** and unlock the "Python Master" badge!`,

  cpp: `**C++** is a powerful, high-performance programming language! ⚡

- **What it does**: System programming, game development, competitive programming, and embedded systems.
- **Why it matters**: Used in game engines (Unreal), browsers (Chrome), and operating systems.
- **Key feature**: Gives you low-level memory control with high-level abstractions.

\`\`\`cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, NextGenHire Warrior! 🚀" << endl;
    return 0;
}
\`\`\`

🎮 **Level up tip**: Our **C++ Course** covers OOP, STL, and DSA to prepare you for coding interviews!`,

  code: `To write and run code on **NextGenHire**, simply use the **Code Compiler** built into our courses! 💻

Here's how to use it:
1. Navigate to any **Lesson** inside a course.
2. You'll see the integrated **Monaco Editor** on the screen.
3. Select your language from the dropdown (HTML, JS, Python, C++, Java).
4. Write your code and click the **RUN CODE** button to execute it instantly!

If you are working on a **Final Project**, you will write your code locally using VS Code and then submit your **GitHub Repository Link** for grading! 🚀`,

  default: `Hey there! 👋 I'm the **NextGenHire AI Mentor**.

I can help you with:
- **📚 Technical Concepts** — HTML, CSS, JavaScript, React, Node.js, Python, C++
- **🎮 Platform Features** — XP, Streaks, Quests, Leaderboards
- **💼 Career Guidance** — Resumes, interviews, job applications

What would you like to learn about? Just ask me anything! 🚀`
};

function getFallbackReply(message) {
  const msg = message.toLowerCase();
  // ⚠️ ORDER MATTERS: Check more specific terms BEFORE generic ones
  // e.g. "node js" must match Node.js, NOT JavaScript
  if (msg.includes("node"))                                                      return FALLBACK_RESPONSES.node;
  if (msg.includes("react") || msg.includes("component"))                        return FALLBACK_RESPONSES.react;
  if (msg.includes("python"))                                                    return FALLBACK_RESPONSES.python;
  if (msg.includes("c++") || msg.includes("cpp"))                                return FALLBACK_RESPONSES.cpp;
  if (msg.includes("html"))                                                      return FALLBACK_RESPONSES.html;
  if (msg.includes("css") || msg.includes("style"))                              return FALLBACK_RESPONSES.css;
  if (msg.includes("javascript") || msg.includes("js"))                          return FALLBACK_RESPONSES.javascript;
  if (msg.includes("xp") || msg.includes("level") || msg.includes("strobe") || msg.includes("streak") || msg.includes("leaderboard")) return FALLBACK_RESPONSES.xp;
  if (msg.includes("job") || msg.includes("hire") || msg.includes("apply") || msg.includes("resume")) return FALLBACK_RESPONSES.job;
  if (msg.includes("code") || msg.includes("run") || msg.includes("compiler") || msg.includes("project")) return FALLBACK_RESPONSES.code;
  return FALLBACK_RESPONSES.default;
}

// ── Main Route ───────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "REPLACE_WITH_YOUR_KEY") {
      console.warn("[chatbot] No GEMINI_API_KEY found in .env.");
      return res.json({ reply: getFallbackReply(message) });
    }

    // Clean and validate history for Gemini's strict format
    const cleanHistory = (history || [])
      .filter(m => m.parts && m.parts[0] && m.parts[0].text && m.parts[0].text.trim() !== "")
      .map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: String(m.parts[0].text) }]
      }));

    // Try models in order: primary → fallback → last resort → offline
    let reply;
    const models = [
      { model: primaryModel,  name: "gemini-2.0-flash",      needsContext: false },
      { model: fallbackModel, name: "gemini-2.0-flash-lite",  needsContext: false },
      { model: lastResort,    name: "gemma-3-4b-it",          needsContext: true  },
    ];

    for (const { model, name, needsContext } of models) {
      try {
        reply = await tryChat(model, message, cleanHistory, needsContext);
        console.log(`[chatbot] ✅ Success (${name})`);
        break;
      } catch (err) {
        console.warn(`[chatbot] ${name} failed:`, err.message?.slice(0, 100));
      }
    }

    // If all AI models failed, use rich offline responses
    if (!reply) {
      reply = getFallbackReply(message);
      console.log("[chatbot] ⚠️ All AI models rate-limited, using offline fallback");
    }

    res.json({ reply });
  } catch (error) {
    console.error("[chatbot] Unexpected error:", error.message);
    res.json({ reply: getFallbackReply(req.body.message || "") });
  }
});

module.exports = router;

// Implement AI chatbot logic - update 1

// Update application models and schemas - update 6

// Add error handling for application routes - update 11

// Refactor prompt generation for Gemini API - update 16

// Refactor controller logic for scalability - update 21

// Optimize AI fallback responses - update 26

// Update project submission endpoints - update 31

// Implement AI chatbot logic - update 36

// Update application models and schemas - update 41
