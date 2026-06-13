const { query } = require("../config/db");
const { normalizeEmail } = require("../utils/normalize");

function publicUser(row) {
  if (!row) return null;
  const fullName = row.full_name || row.name;
  return {
    id: row.id,
    name: fullName,
    full_name: fullName,
    email: row.email,
    role: row.role,
    status: row.status,
    phone: row.phone,
    bio: row.bio,
    last_login_at: row.last_login_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function createUser({ name, email, passwordHash, role = "student" }) {
  const result = await query(
    "INSERT INTO users (name, full_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, 'active')",
    [name, name, normalizeEmail(email), passwordHash, role]
  );
  return findById(result.insertId);
}

async function findByEmail(email) {
  const normalized = normalizeEmail(email);
  const rows = await query(
    `SELECT * FROM users
     WHERE lower(trim(email)) = ?
     ORDER BY CASE WHEN email = ? THEN 0 ELSE 1 END, id ASC
     LIMIT 1`,
    [normalized, normalized]
  );
  return rows[0] || null;
}

async function findById(id) {
  const rows = await query("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
}

async function listStudents(search = "") {
  const like = `%${search}%`;
  return query(
    `SELECT id, COALESCE(full_name, name) AS name, full_name, email, phone, bio, status, last_login_at, created_at, updated_at
     FROM users
     WHERE role = 'student' AND (COALESCE(full_name, name) LIKE ? OR email LIKE ?)
     ORDER BY created_at DESC`,
    [like, like]
  );
}

async function countStudents() {
  const rows = await query("SELECT COUNT(*) AS total FROM users WHERE role = 'student'");
  return rows[0].total;
}

async function updateProfile(id, { name, phone, bio }) {
  await query("UPDATE users SET name = ?, full_name = ?, phone = ?, bio = ? WHERE id = ?", [
    name,
    name,
    phone || null,
    bio || null,
    id
  ]);
  return findById(id);
}

async function markLastLogin(id) {
  await query("UPDATE users SET last_login_at = datetime('now') WHERE id = ?", [id]);
}

async function listUsers({ search = "", filter = "all", page = 1, limit = 10 } = {}) {
  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(limit) || 10, 5), 50);
  const offset = (pageNumber - 1) * pageSize;
  const params = [];
  const where = [];

  if (search) {
    where.push("(COALESCE(u.full_name, u.name) LIKE ? OR u.email LIKE ? OR COALESCE(u.phone, '') LIKE ? OR u.role LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (["active", "inactive", "suspended"].includes(filter)) {
    where.push("u.status = ?");
    params.push(filter);
  } else if (["admin", "student"].includes(filter)) {
    where.push("u.role = ?");
    params.push(filter);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const countRows = await query(`SELECT COUNT(*) AS total FROM users u ${whereSql}`, params);
  const users = await query(
    `SELECT
       u.id,
       COALESCE(u.full_name, u.name) AS full_name,
       u.email,
       u.phone,
       u.role,
       u.status,
       u.last_login_at,
       u.created_at,
       u.updated_at,
       COUNT(DISTINCT n.id) AS total_notes,
       COUNT(DISTINCT l.id) AS total_saved_links,
       COUNT(DISTINCT c.id) AS total_ai_chats
     FROM users u
     LEFT JOIN notes n ON n.user_id = u.id
     LEFT JOIN saved_links l ON l.user_id = u.id
     LEFT JOIN ai_chats c ON c.user_id = u.id
     ${whereSql}
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    users,
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total: countRows[0].total,
      totalPages: Math.max(Math.ceil(countRows[0].total / pageSize), 1)
    }
  };
}

async function getUserDetails(id) {
  const rows = await query(
    `SELECT
       u.id,
       COALESCE(u.full_name, u.name) AS full_name,
       u.name,
       u.email,
       u.phone,
       u.role,
       u.status,
       u.bio,
       u.last_login_at,
       u.created_at,
       u.updated_at,
       COUNT(DISTINCT n.id) AS total_notes,
       COUNT(DISTINCT l.id) AS total_saved_links,
       COUNT(DISTINCT c.id) AS total_ai_chats
     FROM users u
     LEFT JOIN notes n ON n.user_id = u.id
     LEFT JOIN saved_links l ON l.user_id = u.id
     LEFT JOIN ai_chats c ON c.user_id = u.id
     WHERE u.id = ?
     GROUP BY u.id
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function createManagedUser({ fullName, email, phone, passwordHash, role, status }) {
  const result = await query(
    "INSERT INTO users (name, full_name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [fullName, fullName, normalizeEmail(email), phone || null, passwordHash, role, status]
  );
  return getUserDetails(result.insertId);
}

async function updateManagedUser(id, { fullName, email, phone, role, status }) {
  await query("UPDATE users SET name = ?, full_name = ?, email = ?, phone = ?, role = ?, status = ? WHERE id = ?", [
    fullName,
    fullName,
    normalizeEmail(email),
    phone || null,
    role,
    status,
    id
  ]);
  return getUserDetails(id);
}

async function deleteManagedUser(id) {
  await query("DELETE FROM users WHERE id = ?", [id]);
}

async function updateStatus(id, status) {
  await query("UPDATE users SET status = ? WHERE id = ?", [status, id]);
  return getUserDetails(id);
}

async function updateRole(id, role) {
  await query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
  return getUserDetails(id);
}

async function updatePassword(id, passwordHash) {
  await query("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, id]);
  return getUserDetails(id);
}

module.exports = {
  publicUser,
  createUser,
  findByEmail,
  findById,
  listStudents,
  countStudents,
  updateProfile,
  markLastLogin,
  listUsers,
  getUserDetails,
  createManagedUser,
  updateManagedUser,
  deleteManagedUser,
  updateStatus,
  updateRole,
  updatePassword
};
