const cookieParser = require("cookie-parser");
const express = require("express");
const fs = require("fs");
const path = require("path");

const env = require("./config/env");
const { areTablesReady } = require("./config/database");
const initDb = require("./db/initDb");
const { getDefaultAdminCheck, isDefaultAdminReady, resetDefaultAdmin } = require("./db/seedDb");
const categoryModel = require("./models/categoryModel");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const noteRoutes = require("./routes/noteRoutes");
const linkRoutes = require("./routes/linkRoutes");
const articleRoutes = require("./routes/articleRoutes");
const adminRoutes = require("./routes/adminRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { configureSecurity, apiLimiter, sanitizeRequest } = require("./middleware/security");
const { authenticate, authorize } = require("./middleware/auth");

const app = express();
const port = env.port;

configureSecurity(app);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(sanitizeRequest);
app.use("/api", apiLimiter);

app.get("/api/health", async (req, res, next) => {
  try {
    const tablesReady = await areTablesReady();
    res.json({
      ok: true,
      database: "sqlite",
      tablesReady,
      adminReady: await isDefaultAdminReady(),
      status: "running"
    });
  } catch (error) {
    next(error);
  }
});

function getRequestKey(req, headerName, bodyName) {
  return String(req.get(headerName) || req.body?.[bodyName] || req.query?.key || "");
}

function routeNotFound(res) {
  return res.status(404).json({ message: "Route not found" });
}

function requireConfiguredKey(req, res, key, headerName, bodyName) {
  if (!key) return routeNotFound(res);
  if (getRequestKey(req, headerName, bodyName) !== key) {
    return res.status(403).json({ message: "Invalid reset key" });
  }
  return null;
}

if (env.nodeEnv !== "production" || env.adminDebugKey) {
  app.get("/api/debug/admin-check", async (req, res, next) => {
    try {
      if (env.adminDebugKey && getRequestKey(req, "x-admin-debug-key", "adminDebugKey") !== env.adminDebugKey) {
        return res.status(403).json({ message: "Invalid debug key" });
      }

      return res.json({
        ok: true,
        admin: await getDefaultAdminCheck()
      });
    } catch (error) {
      return next(error);
    }
  });
}

app.post("/api/admin-reset", async (req, res, next) => {
  try {
    const blocked = requireConfiguredKey(req, res, env.adminResetKey, "x-admin-reset-key", "adminResetKey");
    if (blocked) return blocked;

    await resetDefaultAdmin();
    return res.json({
      ok: true,
      admin: await getDefaultAdminCheck()
    });
  } catch (error) {
    return next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.get("/api/categories", authenticate, authorize("student", "admin"), async (req, res, next) => {
  try {
    res.json({ categories: await categoryModel.listCategories(req.query.search || "") });
  } catch (error) {
    next(error);
  }
});
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
    res.status(503).send("React production build not found. Run `npm run build` before starting the production server.");
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
