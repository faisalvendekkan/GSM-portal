const { query } = require("../config/db");

async function createAuditLog({ adminId, action, targetUserId, details = {} }) {
  await query("INSERT INTO audit_logs (admin_id, action, target_user_id, details) VALUES (?, ?, ?, ?)", [
    adminId,
    action,
    targetUserId || null,
    JSON.stringify(details)
  ]);
}

async function listForUser(userId, limit = 20) {
  return query(
    `SELECT a.*, u.full_name AS admin_full_name, u.name AS admin_name, u.email AS admin_email
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.admin_id
     WHERE a.target_user_id = ?
     ORDER BY a.created_at DESC
     LIMIT ?`,
    [userId, Number(limit)]
  );
}

module.exports = {
  createAuditLog,
  listForUser
};
