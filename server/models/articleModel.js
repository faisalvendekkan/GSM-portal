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

async function listArticles({ search = "", categoryId = "", limit = null } = {}) {
  const params = [];
  const where = [];
  if (search) {
    where.push("(a.title LIKE ? OR a.content LIKE ? OR COALESCE(a.tags, '') LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (categoryId) {
    where.push("a.category_id = ?");
    params.push(categoryId);
  }
  const sqlLimit = limit ? " LIMIT ?" : "";
  if (limit) params.push(Number(limit));
  return query(
    `SELECT a.*, c.name AS category_name, u.name AS author_name
     FROM articles a
     LEFT JOIN categories c ON c.id = a.category_id
     LEFT JOIN users u ON u.id = a.created_by
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY a.updated_at DESC${sqlLimit}`,
    params
  );
}

async function getArticleBySlug(slug) {
  const rows = await query(
    `SELECT a.*, c.name AS category_name, u.name AS author_name
     FROM articles a
     LEFT JOIN categories c ON c.id = a.category_id
     LEFT JOIN users u ON u.id = a.created_by
     WHERE a.slug = ?
     LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

async function getArticleById(id) {
  const rows = await query(
    `SELECT a.*, c.name AS category_name, u.name AS author_name
     FROM articles a
     LEFT JOIN categories c ON c.id = a.category_id
     LEFT JOIN users u ON u.id = a.created_by
     WHERE a.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function createArticle({ title, slug, categoryId, content, imageUrl, videoUrl, tags, createdBy }) {
  const result = await query(
    `INSERT INTO articles (title, slug, category_id, content, image_url, video_url, tags, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, slug, categoryId || null, content, imageUrl || null, videoUrl || null, normalizeTags(tags), createdBy]
  );
  return getArticleById(result.insertId);
}

async function updateArticle(id, { title, slug, categoryId, content, imageUrl, videoUrl, tags }) {
  await query(
    `UPDATE articles
     SET title = ?, slug = ?, category_id = ?, content = ?, image_url = ?, video_url = ?, tags = ?
     WHERE id = ?`,
    [title, slug, categoryId || null, content, imageUrl || null, videoUrl || null, normalizeTags(tags), id]
  );
  return getArticleById(id);
}

async function deleteArticle(id) {
  await query("DELETE FROM articles WHERE id = ?", [id]);
}

async function countArticles() {
  const rows = await query("SELECT COUNT(*) AS total FROM articles");
  return rows[0].total;
}

module.exports = {
  listArticles,
  getArticleBySlug,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  countArticles
};
