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
  multipleStatements: true,
});

const migrationSQL = fs.readFileSync(
  path.join(__dirname, "../database/create_investment_withdrawal_requests.sql"),
  "utf8"
);

console.log("Running investment_withdrawal_requests migration...");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
  connection.query(migrationSQL, (err, results) => {
    if (err) {
      console.error("Migration error:", err.message);
      connection.end();
      process.exit(1);
    }
    console.log("✅ investment_withdrawal_requests table created.");
    connection.end();
  });
});
