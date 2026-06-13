const { areTablesReady, initializeDatabase, saveDatabase } = require("../config/database");
const seedDb = require("./seedDb");
const { ensureDefaultStudent, resetDefaultAdminIfEnabled } = require("./seedDb");

async function initDb() {
  await initializeDatabase();
  console.log(`Tables ready: ${await areTablesReady()}`);
  await seedDb();
  await resetDefaultAdminIfEnabled();
  await ensureDefaultStudent();
  saveDatabase();
  console.log("SQLite database ready.");
}

if (require.main === module) {
  initDb()
    .then(() => console.log("SQLite database initialized."))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = initDb;
