const chatModel = require("../models/chatModel");
const env = require("../config/env");

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const blockedPatterns = [
  /frp\s*bypass/i,
  /icloud\s*bypass/i,
  /bypass.*lock/i,
  /unlock.*stolen/i,
  /imei.*change/i,
  /remove.*activation/i,
  /account\s*bypass/i,
  /hacking/i
];

function blockedAnswer() {
  return [
    "English:",
    "I cannot help with bypassing locks, stolen-device unlocking, IMEI tampering, hacking, account bypass, or other illegal access. For a legitimate customer repair, verify ownership first, then use official account recovery, a service center, or a manufacturer-supported reset process.",
    "",
    "Malayalam:",
    "ലോക്ക് ബൈപാസ്, മോഷ്ടിച്ച ഫോൺ അൺലോക്ക്, IMEI മാറ്റം, ഹാക്കിംഗ്, അക്കൗണ്ട് ബൈപാസ്, അല്ലെങ്കിൽ നിയമവിരുദ്ധ ആക്സസ് എന്നിവയിൽ സഹായിക്കാനാവില്ല. നിയമാനുസൃതമായ കസ്റ്റമർ റിപ്പയർ ആണെങ്കിൽ ആദ്യം ഉടമസ്ഥാവകാശം ഉറപ്പാക്കുക, തുടർന്ന് ഔദ്യോഗിക അക്കൗണ്ട് റിക്കവറി, സർവീസ് സെന്റർ, അല്ലെങ്കിൽ നിർമ്മാതാവ് പിന്തുണയ്ക്കുന്ന റീസെറ്റ് മാർഗം ഉപയോഗിക്കുക."
  ].join("\n");
}

function systemPrompt() {
  return `You are an AI repair assistant for mobile phone technicians and students. Help diagnose repair issues from text and images. The user may upload PCB photos, phone photos, connector photos, IC photos, charging section photos, display photos, or damaged phone photos. Give practical, step-by-step technician-friendly guidance. Mention visual observations from the image carefully. If the image is unclear, ask for a clearer image. Always answer in English first, then Malayalam. Do not provide illegal bypass, FRP bypass, stolen phone unlocking, IMEI changing, hacking, or harmful instructions.

Every response must use this format:
English:
<answer>

Malayalam:
<answer in Malayalam>

Include repair safety warnings inside the answer when relevant. If an image is attached, mention what can be observed, possible repair checks, safe next steps, and ask for a closer photo when the image is unclear. Do not pretend certainty from an unclear image.`;
}

function fallbackAnswer({ missingKey = false } = {}) {
  if (missingKey) {
    return [
      "English:",
      "AI service is not configured yet. Please add GEMINI_API_KEY in environment variables, then try again.",
      "",
      "Malayalam:",
      "AI സേവനം ഇപ്പോൾ കോൺഫിഗർ ചെയ്തിട്ടില്ല. GEMINI_API_KEY environment variable ആയി ചേർത്തതിന് ശേഷം വീണ്ടും ശ്രമിക്കുക."
    ].join("\n");
  }

  return [
    "English:",
    "Gemini could not respond right now. Please try again in a moment. For safety, disconnect the battery before board work, avoid excessive heat, and verify customer ownership before software or account-related service.",
    "",
    "Malayalam:",
    "Gemini ഇപ്പോൾ പ്രതികരിക്കാൻ കഴിഞ്ഞില്ല. കുറച്ച് സമയം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക. സുരക്ഷയ്ക്കായി ബോർഡ് ജോലി തുടങ്ങുന്നതിന് മുമ്പ് ബാറ്ററി വേർപെടുത്തുക, അമിത ചൂട് ഒഴിവാക്കുക, സോഫ്റ്റ്വെയർ അല്ലെങ്കിൽ അക്കൗണ്ട് ബന്ധപ്പെട്ട സർവീസുകൾക്ക് മുമ്പ് കസ്റ്റമറുടെ ഉടമസ്ഥാവകാശം ഉറപ്പാക്കുക."
  ].join("\n");
}

function validateImage(file) {
  if (!file) return null;
  if (!allowedImageTypes.has(file.mimetype)) {
    const error = new Error("Unsupported image type. Please upload a JPEG, PNG, or WebP photo.");
    error.status = 400;
    throw error;
  }
  if (!file.buffer || !file.buffer.length) {
    const error = new Error("We could not read the image. Please upload or capture the photo again.");
    error.status = 400;
    throw error;
  }
  return {
    mimeType: file.mimetype,
    data: file.buffer.toString("base64")
  };
}

async function askGemini(question, image = null) {
  const apiKey = env.geminiApiKey;
  if (!apiKey) return null;

  const model = env.geminiModel;
  const parts = [{ text: `${systemPrompt()}\n\nStudent question: ${question}` }];
  if (image) {
    parts.push({
      inline_data: {
        mime_type: image.mimeType,
        data: image.data
      }
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }]
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
    const image = validateImage(req.file);
    const imageAttached = Boolean(image);
    let answer;

    if (blockedPatterns.some((pattern) => pattern.test(question))) {
      answer = blockedAnswer();
    } else {
      answer = (await askGemini(question, image)) || fallbackAnswer({ missingKey: !env.geminiApiKey });
    }

    const saved = await chatModel.createChat(req.user.id, { question, answer, provider: "gemini", imageAttached });
    res.json({ chat: saved });
  } catch (error) {
    if (error.status && error.status < 500) return res.status(error.status).json({ message: error.message });

    try {
      const answer = fallbackAnswer();
      const saved = await chatModel.createChat(req.user.id, {
        question: req.body.question,
        answer,
        provider: "gemini",
        imageAttached: Boolean(req.file)
      });
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
