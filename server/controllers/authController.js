const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const userModel = require("../models/userModel");
const refreshTokenModel = require("../models/refreshTokenModel");

const accessSecret = env.accessSecret;
const refreshSecret = env.refreshSecret;
const accessExpires = env.accessTokenExpires;
const refreshExpires = env.refreshTokenExpires;
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
    { id: user.id, name: user.name, email: user.email, role: user.role },
    accessSecret,
    { expiresIn: accessExpires }
  );
}

async function issueRefreshToken(user) {
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, refreshSecret, { expiresIn: refreshExpires });
  const expiresAt = sqliteDate(new Date(Date.now() + durationToMs(refreshExpires)));
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
    maxAge: durationToMs(refreshExpires),
    path: "/api/auth"
  });
}

async function respondWithTokens(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user);
  setRefreshCookie(res, refreshToken);
  return res.json({ user: userModel.publicUser(user), accessToken });
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existing = await userModel.findByEmail(email);
    if (existing) return res.status(409).json({ message: "An account already exists for this email." });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userModel.createUser({ name, email, passwordHash, role: "student" });
    await userModel.markLastLogin(user.id);
    return respondWithTokens(res, user);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await userModel.findByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid email or password." });
    if (user.status && user.status !== "active") {
      return res.status(403).json({ message: "This account is not active. Please contact an admin." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: "Invalid email or password." });

    await userModel.markLastLogin(user.id);
    return respondWithTokens(res, user);
  } catch (error) {
    return next(error);
  }
}

async function adminLogin(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await userModel.findByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid admin credentials" });
    if (user.role !== "admin") return res.status(401).json({ message: "Invalid admin credentials" });
    if (user.status !== "active") {
      return res.status(403).json({ message: "Admin account is inactive" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: "Invalid admin credentials" });

    await userModel.markLastLogin(user.id);
    return respondWithTokens(res, user);
  } catch (error) {
    return next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies[cookieName];
    if (!token) return res.status(401).json({ message: "Refresh token missing." });

    const payload = jwt.verify(token, refreshSecret);
    const tokenHash = hashToken(token);
    const stored = await refreshTokenModel.findActiveRefreshToken(tokenHash);
    if (!stored) return res.status(401).json({ message: "Refresh token is no longer valid." });

    await refreshTokenModel.revokeRefreshToken(tokenHash);
    const user = await userModel.findById(payload.id);
    if (!user) return res.status(401).json({ message: "Account no longer exists." });

    return respondWithTokens(res, user);
  } catch (error) {
    return res.status(401).json({ message: "Please sign in again." });
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies[cookieName];
    if (token) await refreshTokenModel.revokeRefreshToken(hashToken(token));
    res.clearCookie(cookieName, { path: "/api/auth" });
    return res.json({ message: "Logged out successfully." });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({ user: userModel.publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const user = await userModel.updateProfile(req.user.id, req.body);
    return res.json({ user: userModel.publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  adminLogin,
  refresh,
  logout,
  me,
  updateProfile
};
