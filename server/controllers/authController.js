const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const userModel = require("../models/userModel");
const refreshTokenModel = require("../models/refreshTokenModel");
const {
  clearRefreshCookie,
  cookieName,
  hashToken,
  issueRefreshToken,
  setRefreshCookie,
  signAccessToken
} = require("../utils/authTokens");
const { normalizeEmail } = require("../utils/normalize");

async function respondWithTokens(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user);
  setRefreshCookie(res, refreshToken);
  return res.json({ user: userModel.publicUser(user), accessToken });
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const existing = await userModel.findByEmail(normalizedEmail);
    if (existing) return res.status(409).json({ message: "An account already exists for this email." });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userModel.createUser({ name, email: normalizedEmail, passwordHash, role: "student" });
    await userModel.markLastLogin(user.id);
    return respondWithTokens(res, user);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
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
    const email = normalizeEmail(req.body.email);
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

    const payload = jwt.verify(token, env.refreshSecret);
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
    clearRefreshCookie(res);
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
