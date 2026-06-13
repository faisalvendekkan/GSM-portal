const { initializeDatabase, saveDatabase } = require("../config/database");
const { resetDefaultAdmin, setupDefaultStudent } = require("../db/seedDb");

async function resetAdmin() {
  await initializeDatabase();
  const admin = await resetDefaultAdmin();
  await setupDefaultStudent();
  saveDatabase();
  console.log(`Admin reset completed for ${admin.email}`);
}

resetAdmin().catch((error) => {
  console.error("Failed to reset default admin.");
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
