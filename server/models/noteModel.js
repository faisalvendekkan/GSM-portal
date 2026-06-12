const { query } = require("../config/db");

function normalizeTags(tags) {
  if (!tags) return JSON.stringify([]);
  if (Array.isArray(tags)) return JSON.stringify(tags.map((tag) => String(tag).trim()).filter(Boolean));
  return JSON.stringify(
    String(tags)
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  );
}

async function listNotes(userId, { search = "", categoryId = "" } = {}) {
  const params = [userId];
  const where = ["n.user_id = ?"];
  if (search) {
    where.push("(n.title LIKE ? OR n.description LIKE ? OR COALESCE(n.tags, '') LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (categoryId) {
    where.push("n.category_id = ?");
    params.push(categoryId);
  }
  return query(
    `SELECT n.*, c.name AS category_name
     FROM notes n
     LEFT JOIN categories c ON c.id = n.category_id
     WHERE ${where.join(" AND ")}
     ORDER BY n.updated_at DESC`,
    params
  );
}

async function recentNotes(userId, limit = 5) {
  return query(
    `SELECT n.*, c.name AS category_name
     FROM notes n
     LEFT JOIN categories c ON c.id = n.category_id
     WHERE n.user_id = ?
     ORDER BY n.updated_at DESC
     LIMIT ?`,
    [userId, Number(limit)]
  );
}

async function getNote(userId, id) {
  const rows = await query(
    `SELECT n.*, c.name AS category_name
     FROM notes n
     LEFT JOIN categories c ON c.id = n.category_id
     WHERE n.user_id = ? AND n.id = ?
     LIMIT 1`,
    [userId, id]
  );
  return rows[0] || null;
}

async function createNote(userId, { title, categoryId, description, tags }) {
  const result = await query(
    "INSERT INTO notes (user_id, title, category_id, description, tags) VALUES (?, ?, ?, ?, ?)",
    [userId, title, categoryId || null, description, normalizeTags(tags)]
  );
  return getNote(userId, result.insertId);
}

async function updateNote(userId, id, { title, categoryId, description, tags }) {
  await query(
    "UPDATE notes SET title = ?, category_id = ?, description = ?, tags = ? WHERE id = ? AND user_id = ?",
    [title, categoryId || null, description, normalizeTags(tags), id, userId]
  );
  return getNote(userId, id);
}

async function deleteNote(userId, id) {
  await query("DELETE FROM notes WHERE id = ? AND user_id = ?", [id, userId]);
}

async function countNotes(userId = null) {
  const rows = userId
    ? await query("SELECT COUNT(*) AS total FROM notes WHERE user_id = ?", [userId])
    : await query("SELECT COUNT(*) AS total FROM notes");
  return rows[0].total;
}

module.exports = {
  listNotes,
  recentNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  countNotes
};
