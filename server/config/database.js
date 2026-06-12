const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");
const env = require("./env");

let SQL = null;
let db = null;
let initialized = false;

function ensureDataDir() {
  fs.mkdirSync(path.dirname(env.sqliteDbPath), { recursive: true });
}

function persist() {
  if (!db) return;
  ensureDataDir();
  const data = db.export();
  fs.writeFileSync(env.sqliteDbPath, Buffer.from(data));
}

async function initializeDatabase() {
  if (initialized) return db;
  ensureDataDir();
  SQL = await initSqlJs({
    locateFile(file) {
      return require.resolve(`sql.js/dist/${file}`);
    }
  });

  if (fs.existsSync(env.sqliteDbPath)) {
    const fileBuffer = fs.readFileSync(env.sqliteDbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    persist();
  }

  db.run("PRAGMA foreign_keys = ON");
  initialized = true;
  return db;
}

function requireDb() {
  if (!db) {
    throw new Error("SQLite database is not initialized. Run npm run init-db or restart the server.");
  }
  return db;
}

function normalizeParams(params = []) {
  return params.map((value) => (value === undefined ? null : value));
}

function isRead(sql) {
  return /^\s*(select|pragma|with)\b/i.test(sql);
}

async function query(sql, params = []) {
  const database = requireDb();
  const stmt = database.prepare(sql);
  const normalized = normalizeParams(params);

  try {
    if (isRead(sql)) {
      stmt.bind(normalized);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      return rows;
    }

    stmt.run(normalized);
    stmt.free();
    const insertId = database.exec("SELECT last_insert_rowid() AS insertId")[0]?.values?.[0]?.[0] || 0;
    const changes = database.exec("SELECT changes() AS changes")[0]?.values?.[0]?.[0] || 0;
    persist();
    return { insertId: Number(insertId), changes: Number(changes) };
  } finally {
    try {
      stmt.free();
    } catch (error) {
      // Statement may already be freed after writes.
    }
  }
}

async function exec(sql) {
  const database = requireDb();
  database.run(sql);
  persist();
}

async function transaction(callback) {
  const database = requireDb();
  database.run("BEGIN");
  try {
    const result = await callback(database);
    database.run("COMMIT");
    persist();
    return result;
  } catch (error) {
    database.run("ROLLBACK");
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  query,
  exec,
  transaction,
  persist
};
