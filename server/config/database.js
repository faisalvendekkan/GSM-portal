const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");
const env = require("./env");

const REQUIRED_TABLES = [
  "users",
  "categories",
  "notes",
  "saved_links",
  "articles",
  "ai_chats",
  "refresh_tokens",
  "audit_logs"
];

let SQL = null;
let db = null;
let initialized = false;
let initPromise = null;

function ensureDataDir() {
  fs.mkdirSync(path.dirname(env.sqliteDbPath), { recursive: true });
}

function saveDatabase() {
  if (!db) {
    throw new Error("Cannot save SQLite database before initialization.");
  }
  ensureDataDir();
  const data = Buffer.from(db.export());
  const fd = fs.openSync(env.sqliteDbPath, "w");
  try {
    fs.writeFileSync(fd, data);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  return env.sqliteDbPath;
}

function openExistingDatabase(fileBuffer) {
  const opened = fileBuffer.length ? new SQL.Database(fileBuffer) : new SQL.Database();
  opened.exec("SELECT name FROM sqlite_master LIMIT 1");
  return opened;
}

async function initializeDatabase() {
  if (initialized) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    console.log(`SQLite database path: ${env.sqliteDbPath}`);
    ensureDataDir();
    SQL = await initSqlJs({
      locateFile(file) {
        return require.resolve(`sql.js/dist/${file}`);
      }
    });

    if (fs.existsSync(env.sqliteDbPath)) {
      const fileBuffer = fs.readFileSync(env.sqliteDbPath);
      try {
        db = openExistingDatabase(fileBuffer);
      } catch (error) {
        const backupPath = `${env.sqliteDbPath}.corrupt-${Date.now()}`;
        fs.renameSync(env.sqliteDbPath, backupPath);
        console.error(`SQLite database could not be opened. Backed it up to: ${backupPath}`);
        db = new SQL.Database();
        saveDatabase();
      }
    } else {
      db = new SQL.Database();
      saveDatabase();
    }

    db.run("PRAGMA foreign_keys = ON");
    initialized = true;
    ensureSchema();
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

function tableExists(tableName) {
  if (!db) return false;
  const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1");
  try {
    stmt.bind([tableName]);
    return stmt.step();
  } finally {
    stmt.free();
  }
}

function missingRequiredTables() {
  return REQUIRED_TABLES.filter((tableName) => !tableExists(tableName));
}

function tableColumns(tableName) {
  if (!db || !tableExists(tableName)) return [];
  const escapedTable = String(tableName).replace(/'/g, "''");
  const result = db.exec(`PRAGMA table_info('${escapedTable}')`);
  return (result[0]?.values || []).map((row) => row[1]);
}

function ensureColumn(tableName, columnName, definition) {
  const columns = tableColumns(tableName);
  if (!columns.length || columns.includes(columnName)) return;
  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  console.log(`SQLite schema repaired: added ${tableName}.${columnName}`);
}

function ensureColumnRepairs() {
  ensureColumn("users", "name", "TEXT");
  ensureColumn("users", "full_name", "TEXT");
  ensureColumn("users", "phone", "TEXT");
  ensureColumn("users", "bio", "TEXT");
  ensureColumn("users", "last_login_at", "TEXT");
  ensureColumn("users", "created_at", "TEXT");
  ensureColumn("users", "updated_at", "TEXT");
  ensureColumn("categories", "created_by", "INTEGER");
  ensureColumn("categories", "created_at", "TEXT");
  ensureColumn("categories", "updated_at", "TEXT");
  ensureColumn("articles", "created_by", "INTEGER");
  ensureColumn("articles", "video_url", "TEXT");
  ensureColumn("articles", "tags", "TEXT");
  ensureColumn("articles", "created_at", "TEXT");
  ensureColumn("articles", "updated_at", "TEXT");
  ensureColumn("notes", "tags", "TEXT");
  ensureColumn("notes", "created_at", "TEXT");
  ensureColumn("notes", "updated_at", "TEXT");
  ensureColumn("saved_links", "description", "TEXT");
  ensureColumn("saved_links", "created_at", "TEXT");
  ensureColumn("saved_links", "updated_at", "TEXT");
  ensureColumn("ai_chats", "provider", "TEXT");
  ensureColumn("ai_chats", "created_at", "TEXT");
  ensureColumn("refresh_tokens", "revoked_at", "TEXT");
  ensureColumn("refresh_tokens", "created_at", "TEXT");
}

function ensureSchema() {
  if (!db) {
    throw new Error("SQLite database must be opened before ensuring schema.");
  }

  const missingTables = missingRequiredTables();
  const schema = require("../db/schema");
  db.exec(schema);
  ensureColumnRepairs();
  db.exec(`
    UPDATE users SET full_name = COALESCE(full_name, name, email, 'User') WHERE full_name IS NULL;
    UPDATE users SET name = COALESCE(name, full_name, email, 'User') WHERE name IS NULL;
    UPDATE users SET created_at = COALESCE(created_at, datetime('now')) WHERE created_at IS NULL;
    UPDATE users SET updated_at = COALESCE(updated_at, datetime('now')) WHERE updated_at IS NULL;
  `);
  saveDatabase();

  if (missingTables.length) {
    console.log(`SQLite schema created or repaired. Missing tables were: ${missingTables.join(", ")}`);
  } else {
    console.log("SQLite schema already exists.");
  }

  const remainingMissingTables = missingRequiredTables();
  if (remainingMissingTables.length) {
    throw new Error(`SQLite schema initialization failed. Missing tables: ${remainingMissingTables.join(", ")}`);
  }
}

async function areTablesReady() {
  await initializeDatabase();
  return missingRequiredTables().length === 0;
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
    saveDatabase();
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
  saveDatabase();
}

async function transaction(callback) {
  const database = await getDb();
  database.run("BEGIN");
  try {
    const result = await callback(database);
    database.run("COMMIT");
    saveDatabase();
    return result;
  } catch (error) {
    database.run("ROLLBACK");
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  ensureSchema,
  saveDatabase,
  areTablesReady,
  query,
  exec,
  transaction,
  persist: saveDatabase,
  resetDatabaseForTests
};
