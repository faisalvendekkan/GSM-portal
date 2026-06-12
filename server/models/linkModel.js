const { query } = require("../config/db");

async function listLinks(userId, { search = "", categoryId = "" } = {}) {
  const params = [userId];
  const where = ["l.user_id = ?"];
  if (search) {
    where.push("(l.title LIKE ? OR l.url LIKE ? OR l.description LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (categoryId) {
    where.push("l.category_id = ?");
    params.push(categoryId);
  }
  return query(
    `SELECT l.*, c.name AS category_name
     FROM saved_links l
     LEFT JOIN categories c ON c.id = l.category_id
     WHERE ${where.join(" AND ")}
     ORDER BY l.updated_at DESC`,
    params
  );
}

async function recentLinks(userId, limit = 5) {
  return query(
    `SELECT l.*, c.name AS category_name
     FROM saved_links l
     LEFT JOIN categories c ON c.id = l.category_id
     WHERE l.user_id = ?
     ORDER BY l.updated_at DESC
     LIMIT ?`,
    [userId, Number(limit)]
  );
}

async function getLink(userId, id) {
  const rows = await query(
    `SELECT l.*, c.name AS category_name
     FROM saved_links l
     LEFT JOIN categories c ON c.id = l.category_id
     WHERE l.user_id = ? AND l.id = ?
     LIMIT 1`,
    [userId, id]
  );
  return rows[0] || null;
}

async function createLink(userId, { title, url, categoryId, description }) {
  const result = await query(
    "INSERT INTO saved_links (user_id, title, url, category_id, description) VALUES (?, ?, ?, ?, ?)",
    [userId, title, url, categoryId || null, description || null]
  );
  return getLink(userId, result.insertId);
}

async function updateLink(userId, id, { title, url, categoryId, description }) {
  await query(
    "UPDATE saved_links SET title = ?, url = ?, category_id = ?, description = ? WHERE id = ? AND user_id = ?",
    [title, url, categoryId || null, description || null, id, userId]
  );
  return getLink(userId, id);
}

async function deleteLink(userId, id) {
  await query("DELETE FROM saved_links WHERE id = ? AND user_id = ?", [id, userId]);
}

async function countLinks(userId = null) {
  const rows = userId
    ? await query("SELECT COUNT(*) AS total FROM saved_links WHERE user_id = ?", [userId])
    : await query("SELECT COUNT(*) AS total FROM saved_links");
  return rows[0].total;
}

module.exports = {
  listLinks,
  recentLinks,
  getLink,
  createLink,
  updateLink,
  deleteLink,
  countLinks
};
