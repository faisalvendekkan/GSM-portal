require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function main() {
  const target = process.argv[2] === "seed" ? "seed.sql" : "schema.sql";
  const sql = fs.readFileSync(path.join(__dirname, target), "utf8");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "mobile_repair_portal",
    multipleStatements: true
  });

  try {
    await connection.query(sql);
    console.log(`${target} imported successfully.`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
