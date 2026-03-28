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

const sqlFile = fs.readFileSync(
  path.join(__dirname, "../database/create_trail_version_access.sql"),
  "utf8"
);

console.log("Creating trail_version_access table...");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
  connection.query(sqlFile, (err) => {
    if (err) {
      console.error("Error creating trail_version_access table:", err);
      connection.end();
      process.exit(1);
    }
    console.log("✓ trail_version_access table created successfully.");
    connection.end();
  });
});
