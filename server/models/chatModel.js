const { query } = require("../config/db");

async function createChat(userId, { question, answer }) {
  const result = await query("INSERT INTO ai_chats (user_id, question, answer) VALUES (?, ?, ?)", [
    userId,
    question,
    answer
  ]);
  const rows = await query("SELECT * FROM ai_chats WHERE id = ? LIMIT 1", [result.insertId]);
  return rows[0];
}

async function listChats(userId, limit = 50) {
  return query("SELECT * FROM ai_chats WHERE user_id = ? ORDER BY created_at DESC LIMIT ?", [userId, Number(limit)]);
}

async function countChats(userId = null) {
  const rows = userId
    ? await query("SELECT COUNT(*) AS total FROM ai_chats WHERE user_id = ?", [userId])
    : await query("SELECT COUNT(*) AS total FROM ai_chats");
  return rows[0].total;
}

module.exports = {
  createChat,
  listChats,
  countChats
};
