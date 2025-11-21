import mysql from "mysql";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "signup",
  multipleStatements: true,
});

// Read SQL file
const sqlFile = fs.readFileSync(
  path.join(__dirname, "../database/add_employee_columns.sql"),
  "utf8"
);

console.log("Adding missing columns to employee table...");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }

  console.log("Connected to database");

  // Execute SQL
  connection.query(sqlFile, (err, results) => {
    if (err) {
      console.error("Error adding columns:", err);
      connection.end();
      process.exit(1);
    }

    console.log("✅ Employee table columns added successfully!");
    console.log("Added columns: relievingDate, permanentDate");
    connection.end();
    process.exit(0);
  });
});

