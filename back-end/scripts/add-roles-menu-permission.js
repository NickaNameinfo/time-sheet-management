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

console.log("Adding Roles menu permission...\n");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }

  console.log("Connected to database\n");

  // Read SQL file
  const sqlFile = fs.readFileSync(
    path.join(__dirname, "../database/add_roles_menu_permission.sql"),
    "utf8"
  );

  // Execute SQL
  connection.query(sqlFile, (err, results) => {
    if (err) {
      console.error("Error adding roles menu permission:", err);
      connection.end();
      process.exit(1);
    }

    console.log("✅ Roles menu permission added successfully!");
    connection.end();
    process.exit(0);
  });
});
