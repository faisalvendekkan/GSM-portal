const { query } = require("../config/db");

async function listCategories(search = "") {
  const params = [];
  let where = "";
  if (search) {
    where = "WHERE name LIKE ? OR description LIKE ?";
    params.push(`%${search}%`, `%${search}%`);
  }
  return query(`SELECT * FROM categories ${where} ORDER BY name ASC`, params);
}

async function createCategory({ name, slug, description, createdBy }) {
  const result = await query(
    "INSERT INTO categories (name, slug, description, created_by) VALUES (?, ?, ?, ?)",
    [name, slug, description || null, createdBy || null]
  );
  return findById(result.insertId);
}

async function updateCategory(id, { name, slug, description }) {
  await query("UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?", [
    name,
    slug,
    description || null,
    id
  ]);
  return findById(id);
}

async function deleteCategory(id) {
  await query("DELETE FROM categories WHERE id = ?", [id]);
}

async function findById(id) {
  const rows = await query("SELECT * FROM categories WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
}

async function countCategories() {
  const rows = await query("SELECT COUNT(*) AS total FROM categories");
  return rows[0].total;
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  findById,
  countCategories
};
