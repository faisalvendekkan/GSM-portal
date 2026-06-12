const { exec, initializeDatabase } = require("../config/database");
const schema = require("./schema");
const seedDb = require("./seedDb");

async function initDb() {
  await initializeDatabase();
  await exec(schema);
  await seedDb();
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
