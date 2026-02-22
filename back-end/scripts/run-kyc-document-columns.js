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
  path.join(__dirname, "../database/add_kyc_document_columns.sql"),
  "utf8"
);

console.log("Adding aadhaar_document_path and pan_document_path to investment_kyc...");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
  const statements = migrationSQL
    .replace(/--[^\n]*/g, "")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.toUpperCase().startsWith("ALTER"));
  let i = 0;
  const run = () => {
    if (i >= statements.length) {
      console.log("✅ KYC document columns added.");
      connection.end();
      return;
    }
    connection.query(statements[i] + ";", (err) => {
      if (err) {
        if (err.code === "ER_DUP_FIELDNAME") console.warn("Columns already exist, skipping.");
        else {
          console.error("Migration error:", err.message);
          connection.end();
          process.exit(1);
        }
      }
      i++;
      run();
    });
  };
  run();
});
