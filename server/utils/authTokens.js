const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const refreshTokenModel = require("../models/refreshTokenModel");

const cookieName = "mobile_repair_refresh";

function durationToMs(value) {
  const match = String(value).match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2];
  const factors = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return amount * factors[unit];
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sqliteDate(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name || user.full_name, email: user.email, role: user.role },
    env.accessSecret,
    { expiresIn: env.accessTokenExpires }
  );
}

async function issueRefreshToken(user) {
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.refreshSecret, {
    expiresIn: env.refreshTokenExpires
  });
  const expiresAt = sqliteDate(new Date(Date.now() + durationToMs(env.refreshTokenExpires)));
  await refreshTokenModel.storeRefreshToken({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt
  });
  return token;
}

function setRefreshCookie(res, token) {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    maxAge: durationToMs(env.refreshTokenExpires),
    path: "/"
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(cookieName, { path: "/" });
  res.clearCookie(cookieName, { path: "/api/auth" });
}

module.exports = {
  clearRefreshCookie,
  cookieName,
  durationToMs,
  hashToken,
  issueRefreshToken,
  setRefreshCookie,
  signAccessToken
};
