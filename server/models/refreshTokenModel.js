const { query } = require("../config/db");

async function storeRefreshToken({ userId, tokenHash, expiresAt }) {
  await query("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)", [
    userId,
    tokenHash,
    expiresAt
  ]);
}

async function findActiveRefreshToken(tokenHash) {
  const rows = await query(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > UTC_TIMESTAMP()
     LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function revokeRefreshToken(tokenHash) {
  await query("UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP() WHERE token_hash = ? AND revoked_at IS NULL", [
    tokenHash
  ]);
}

async function revokeUserRefreshTokens(userId) {
  await query("UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP() WHERE user_id = ? AND revoked_at IS NULL", [userId]);
}

module.exports = {
  storeRefreshToken,
  findActiveRefreshToken,
  revokeRefreshToken,
  revokeUserRefreshTokens
};
