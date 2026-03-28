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

const sql = fs.readFileSync(
  path.join(__dirname, "../database/create_company_login_requests.sql"),
  "utf8"
);

console.log("Creating company_login_requests table...");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
  connection.query(sql, (err1) => {
    if (err1) {
      console.error("Error creating company_login_requests:", err1);
      connection.end();
      process.exit(1);
    }
    console.log("✓ company_login_requests table ready.");
    connection.end();
  });
});
