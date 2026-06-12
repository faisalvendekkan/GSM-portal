const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");
const env = require("./env");

let SQL = null;
let db = null;
let initialized = false;
let initPromise = null;

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
  if (initPromise) return initPromise;

  initPromise = (async () => {
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
  })();

  try {
    return await initPromise;
  } catch (error) {
    initPromise = null;
    db = null;
    initialized = false;
    throw error;
  }
}

async function getDb() {
  if (!initialized || !db) {
    await initializeDatabase();
  }

  if (!db) {
    throw new Error("SQLite database initialization failed before query execution.");
  }

  return db;
}

async function resetDatabaseForTests() {
  if (db) db.close();
  SQL = null;
  db = null;
  initialized = false;
  initPromise = null;
}

function normalizeParams(params = []) {
  return params.map((value) => (value === undefined ? null : value));
}

function isRead(sql) {
  return /^\s*(select|pragma|with)\b/i.test(sql);
}

async function query(sql, params = []) {
  const database = await getDb();
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
  const database = await getDb();
  database.exec(sql);
  persist();
}

async function transaction(callback) {
  const database = await getDb();
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
  persist,
  resetDatabaseForTests
};
