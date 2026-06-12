const chatModel = require("../models/chatModel");

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
  return [
    "AI provider is not configured yet, but here is a safe repair workflow:",
    "1. Confirm the exact model and fault symptom.",
    "2. Check for liquid damage, bent pins, damaged flex cables, and visible board burns.",
    "3. Test with a known-good charger, cable, battery, and display where relevant.",
    "4. Measure voltage rails before replacing ICs.",
    "5. Disconnect the battery before opening or soldering.",
    `Question noted: ${question}`
  ].join("\n");
}

async function askOpenAI(question) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: question }
      ],
      temperature: 0.35
    })
  });

  if (!response.ok) throw new Error("OpenAI request failed.");
  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

async function askGemini(question) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
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
    } else if ((process.env.AI_PROVIDER || "openai").toLowerCase() === "gemini") {
      answer = (await askGemini(question)) || fallbackAnswer(question);
    } else {
      answer = (await askOpenAI(question)) || fallbackAnswer(question);
    }

    const saved = await chatModel.createChat(req.user.id, { question, answer });
    res.json({ chat: saved });
  } catch (error) {
    try {
      const answer = fallbackAnswer(req.body.question);
      const saved = await chatModel.createChat(req.user.id, { question: req.body.question, answer });
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
