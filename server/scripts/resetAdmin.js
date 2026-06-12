const { initializeDatabase, saveDatabase } = require("../config/database");
const { ensureDefaultAdmin } = require("../db/seedDb");

async function resetAdmin() {
  await initializeDatabase();
  await ensureDefaultAdmin({ forceReset: true });
  saveDatabase();
  console.log("Default admin reset/create completed successfully.");
}

resetAdmin().catch((error) => {
  console.error("Failed to reset default admin.");
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
