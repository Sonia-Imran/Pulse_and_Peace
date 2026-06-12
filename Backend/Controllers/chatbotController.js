const OpenAI = require("openai");
const ChatUsage = require("../models/ChatUsage");

const DAILY_LIMIT = 20;

const SYSTEM_PROMPT = `You are "Pulse AI", a mental health support assistant for Pulse & Peace platform.

SCOPE — STRICTLY FOLLOW:
- ONLY discuss topics related to: mental health, emotional wellbeing, stress, anxiety, depression, sleep, relationships, coping strategies, mindfulness, and general wellness.
- If the user asks about ANYTHING unrelated (coding, math, general knowledge, politics, entertainment, sports, recipes, homework, etc.), politely decline and redirect:
  Example: "I'm here specifically to support your mental health and emotional wellbeing. I'm not able to help with that topic, but I'm happy to talk about how you're feeling or any stress/concerns you have. 💙"

YOUR ROLE:
- Listen empathetically to patients' concerns
- Provide emotional support and practical coping strategies
- Give general mental health guidance (never diagnose medical conditions)
- Keep responses concise and warm (2-4 sentences max)
- Always be non-judgmental

CRISIS / SERIOUS ISSUE DETECTION:
- If the user mentions: self-harm, suicide, suicidal thoughts, wanting to die, hurting themselves or others, severe panic attacks, abuse, or any statement suggesting they are in danger or in severe distress —
  Respond with empathy FIRST, then STRONGLY recommend they consult a real licensed doctor on this platform immediately, and mention they can use the "Chat Now" button to connect with a real doctor.
  Example: "I'm really sorry you're feeling this way, and I want you to know your feelings matter. This sounds serious, and it's important you speak with a licensed doctor right away — please use the 'Chat Now' button below to connect with a real doctor on Pulse & Peace. You don't have to go through this alone."

ESCALATION FOR GENERAL SERIOUS CONCERNS:
- If the user describes ongoing/severe symptoms (chronic insomnia, persistent sadness for weeks, panic attacks, severe anxiety affecting daily life), after offering brief support, gently suggest: "It might really help to talk to one of our licensed doctors for personalized care — you can connect with one using the 'Chat Now' option below."

LANGUAGE:
- Always answer in the SAME language the user writes in (Urdu Roman, Urdu script, or English).`;

const CRISIS_KEYWORDS = [
  "suicide", "suicidal", "kill myself", "end my life", "want to die",
  "hurt myself", "self harm", "self-harm", "cutting myself",
  "khudkushi", "marna chahta", "marna chahti", "mar jaana", "zindagi khatam",
];

const getToday = () => new Date().toISOString().split("T")[0];

const chatWithAI = async (req, res) => {
  try {
    console.log("req.user:", req.user);

    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "User not authenticated. Please login again." });
    }

    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: "Messages array required" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ success: false, message: "Groq API key not configured" });
    }

    const today = getToday();
    let usage = await ChatUsage.findOne({ user: req.user._id });

    if (!usage) {
      usage = await ChatUsage.create({ user: req.user._id, count: 0, date: today });
    }

    if (usage.date !== today) {
      usage.date = today;
      usage.count = 0;
    }

    if (usage.count >= DAILY_LIMIT) {
      return res.status(429).json({
        success: false,
        limitReached: true,
        message: `You've reached your daily limit of ${DAILY_LIMIT} messages. Please try again tomorrow or chat with a real doctor.`,
        remaining: 0,
      });
    }

    const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
    const isCrisis = CRISIS_KEYWORDS.some(kw => lastUserMsg.includes(kw));

    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 220,
      temperature: 0.7,
    });

    const reply = response.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ success: false, message: "No response from AI" });
    }

    usage.count += 1;
    await usage.save();

    res.json({
      success: true,
      reply,
      remaining: DAILY_LIMIT - usage.count,
      isCrisis,
    });

  } catch (err) {
    console.error("Chatbot error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getChatUsage = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    const today = getToday();
    let usage = await ChatUsage.findOne({ user: req.user._id });
    const count = usage && usage.date === today ? usage.count : 0;
    res.json({
      success: true,
      data: { used: count, limit: DAILY_LIMIT, remaining: DAILY_LIMIT - count },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { chatWithAI, getChatUsage };