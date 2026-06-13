const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, "../../.env") });

function fromRoot(relativePath) {
  return path.resolve(__dirname, "../../", relativePath);
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  appUrl: process.env.APP_URL || "http://localhost:3000",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  accessSecret: process.env.JWT_ACCESS_SECRET || "local_access_secret_change_me",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "local_refresh_secret_change_me",
  accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES || "15m",
  refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES || "7d",
  cookieSecure: String(process.env.COOKIE_SECURE || "false") === "true",
  aiProvider: process.env.AI_PROVIDER || "gemini",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  defaultAdminEmail: (process.env.DEFAULT_ADMIN_EMAIL || "admin@gsmportal.local").trim().toLowerCase(),
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || "Admin@12345!",
  resetDefaultAdmin: String(process.env.RESET_DEFAULT_ADMIN || "true").toLowerCase() === "true",
  adminDebugKey: process.env.ADMIN_DEBUG_KEY || "",
  adminResetKey: process.env.ADMIN_RESET_KEY || "",
  sqliteDbPath: path.isAbsolute(process.env.SQLITE_DB_PATH || "")
    ? process.env.SQLITE_DB_PATH
    : fromRoot(process.env.SQLITE_DB_PATH || "server/data/app.sqlite")
};

module.exports = env;
