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

console.log("Adding granular permission columns to menu_permissions table...\n");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }

  console.log("Connected to database\n");

  // Read SQL file
  const sqlFile = fs.readFileSync(
    path.join(__dirname, "../database/add_menu_permission_columns.sql"),
    "utf8"
  );

  // Execute SQL
  connection.query(sqlFile, (err, results) => {
    if (err) {
      console.error("Error adding permission columns:", err);
      connection.end();
      process.exit(1);
    }

    console.log("✅ Permission columns added successfully!");
    console.log("✅ Existing permissions initialized!");
    connection.end();
    process.exit(0);
  });
});
