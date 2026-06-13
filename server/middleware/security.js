const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { validationResult } = require("express-validator");
const env = require("../config/env");

function allowedOrigins() {
  const origins = [env.clientUrl, env.appUrl, "http://localhost:5173", "http://localhost:3000"]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim());
  return [...new Set(origins)];
}

function configureSecurity(app) {
  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy:
        env.nodeEnv === "production"
          ? {
              directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                "img-src": ["'self'", "data:", "https:"],
                "connect-src": ["'self'", ...allowedOrigins(), "https://api.openai.com", "https://generativelanguage.googleapis.com"],
                "script-src": ["'self'"],
                "style-src": ["'self'", "'unsafe-inline'", "https:"]
              }
            }
          : false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      originAgentCluster: false
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins().includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true
    })
  );
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  message: { message: "Too many login attempts. Please wait and try again." },
  standardHeaders: true,
  legacyHeaders: false
});

const adminResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { message: "Too many admin reset attempts. Please wait and try again." },
  standardHeaders: true,
  legacyHeaders: false
});

function cleanValue(value) {
  if (typeof value === "string") return value.trim().replace(/\0/g, "");
  if (Array.isArray(value)) return value.map(cleanValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, cleanValue(nested)]));
  }
  return value;
}

function sanitizeRequest(req, res, next) {
  if (req.body) req.body = cleanValue(req.body);
  if (req.params) req.params = cleanValue(req.params);
  next();
}

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(422).json({
    message: "Please check the form fields.",
    errors: errors.array().map((error) => ({ field: error.path, message: error.msg }))
  });
}

module.exports = {
  configureSecurity,
  apiLimiter,
  adminResetLimiter,
  authLimiter,
  sanitizeRequest,
  validate
};
