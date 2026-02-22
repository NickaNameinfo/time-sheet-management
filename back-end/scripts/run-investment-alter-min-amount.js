import mysql from "mysql";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "signup",
});

const migrationSQL = fs.readFileSync(
  path.join(__dirname, "../database/alter_investment_min_amount.sql"),
  "utf8"
);

console.log("Running migration: Set minimum investment amount to ₹5...");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }

  connection.query(migrationSQL, (err, results) => {
    if (err) {
      console.error("❌ Migration failed:", err.message);
      connection.end();
      process.exit(1);
    }
    const affected = results?.affectedRows ?? 0;
    console.log("✅ Migration completed. Rows updated:", affected);
    connection.end();
    process.exit(0);
  });
});
