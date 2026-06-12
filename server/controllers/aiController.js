const chatModel = require("../models/chatModel");
const env = require("../config/env");

const blockedPatterns = [
  /frp\s*bypass/i,
  /icloud\s*bypass/i,
  /bypass.*lock/i,
  /unlock.*stolen/i,
  /imei.*change/i,
  /remove.*activation/i
];

function blockedAnswer() {
  return [
    "I cannot help with bypassing locks, stolen-device unlocking, IMEI tampering, or other illegal access.",
    "For a legitimate customer repair, verify ownership first, then use the official account recovery, service center, or manufacturer-supported reset process."
  ].join(" ");
}

function systemPrompt() {
  return [
    "You are a mobile phone repair training assistant for students.",
    "Use simple technician-friendly language.",
    "Give step-by-step repair guidance.",
    "Add safety warnings for heat, batteries, power supplies, microsoldering, and data loss.",
    "Do not provide illegal unlocking, bypassing, credential theft, IMEI tampering, or harmful instructions.",
    "Keep answers practical and concise."
  ].join(" ");
}

function fallbackAnswer(question) {
  return "AI service is not configured yet. Please add GEMINI_API_KEY in environment variables.";
}

async function askGemini(question) {
  const apiKey = env.geminiApiKey;
  if (!apiKey) return null;

  const model = env.geminiModel;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt()}\n\nStudent question: ${question}` }] }]
      })
    }
  );

  if (!response.ok) throw new Error("Gemini request failed.");
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n") || null;
}

async function getHistory(req, res, next) {
  try {
    const chats = await chatModel.listChats(req.user.id);
    res.json({ chats: chats.reverse() });
  } catch (error) {
    next(error);
  }
}

async function chat(req, res, next) {
  try {
    const question = req.body.question;
    let answer;

    if (blockedPatterns.some((pattern) => pattern.test(question))) {
      answer = blockedAnswer();
    } else {
      answer = (await askGemini(question)) || fallbackAnswer(question);
    }

    const saved = await chatModel.createChat(req.user.id, { question, answer, provider: "gemini" });
    res.json({ chat: saved });
  } catch (error) {
    try {
      const answer = fallbackAnswer(req.body.question);
      const saved = await chatModel.createChat(req.user.id, { question: req.body.question, answer, provider: "gemini" });
      res.json({ chat: saved, warning: "Live AI request failed, so a safe fallback answer was saved." });
    } catch (fallbackError) {
      next(fallbackError);
    }
  }
}

module.exports = {
  getHistory,
  chat
};
