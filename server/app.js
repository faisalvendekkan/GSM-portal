const cookieParser = require("cookie-parser");
const express = require("express");
const fs = require("fs");
const path = require("path");

const env = require("./config/env");
const { areTablesReady } = require("./config/database");
const initDb = require("./db/initDb");
const {
  getDefaultAdminCheck,
  getDefaultStudentCheck,
  isDefaultAdminReady,
  isDefaultStudentReady,
  resetDefaultAdmin
} = require("./db/seedDb");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const noteRoutes = require("./routes/noteRoutes");
const linkRoutes = require("./routes/linkRoutes");
const articleRoutes = require("./routes/articleRoutes");
const adminRoutes = require("./routes/adminRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { configureSecurity, apiLimiter, adminResetLimiter, sanitizeRequest } = require("./middleware/security");

const app = express();
const port = env.port;

configureSecurity(app);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(sanitizeRequest);
app.use("/api", apiLimiter);

app.get("/api/health", async (req, res, next) => {
  try {
    const tablesReady = await areTablesReady();
    res.json({
      ok: true,
      app: "Mobile Repair AI Student Portal",
      database: "sqlite",
      tablesReady,
      adminReady: await isDefaultAdminReady(),
      studentReady: await isDefaultStudentReady(),
      status: "running"
    });
  } catch (error) {
    next(error);
  }
});

function routeNotFound(res) {
  return res.status(404).json({ message: "Route not found" });
}

app.get("/api/debug/auth-status", async (req, res, next) => {
  try {
    const adminResetKey = process.env.ADMIN_RESET_KEY || "";
    if (!adminResetKey) return routeNotFound(res);
    if (String(req.get("x-admin-reset-key") || "") !== adminResetKey) {
      return res.status(403).json({ message: "Invalid reset key" });
    }

    const [admin, student] = await Promise.all([getDefaultAdminCheck(), getDefaultStudentCheck()]);
    return res.json({
      ok: true,
      tablesReady: await areTablesReady(),
      admin: {
        configuredEmail: admin.configuredEmail,
        exists: admin.exists,
        email: admin.email,
        role: admin.role,
        status: admin.status
      },
      student,
      studentReady: await isDefaultStudentReady()
    });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/admin-reset", adminResetLimiter, async (req, res, next) => {
  try {
    const adminResetKey = process.env.ADMIN_RESET_KEY || "";
    if (!adminResetKey) return routeNotFound(res);
    if (String(req.body?.key || "") !== adminResetKey) {
      return res.status(403).json({ message: "Invalid reset key" });
    }

    const admin = await resetDefaultAdmin();
    return res.json({
      ok: true,
      message: "Admin reset completed",
      email: admin.email
    });
  } catch (error) {
    return next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/links", linkRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

const clientBuildPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
} else {
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.status(503).send("Frontend build missing. Run npm run build.");
  });
}

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? "Something went wrong. Please try again." : err.message
  });
});

async function startServer() {
  try {
    await initDb();
    app.listen(port, () => {
      console.log(`Mobile Repair AI Student Portal running on port ${port}`);
      console.log(`SQLite database: ${env.sqliteDbPath}`);
    });
  } catch (error) {
    console.error("Failed to initialize SQLite database before server startup.");
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
