/**
 * Adds company_users.menu_role_name (Menu Permissions / company portal role).
 * Safe to run multiple times — ignores duplicate column error.
 */
import mysql from "mysql";
import dotenv from "dotenv";

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "signup",
});

const sql = `
ALTER TABLE company_users
  ADD COLUMN menu_role_name VARCHAR(100) NULL DEFAULT NULL
  COMMENT 'Sidebar: must match menu_permissions role tags (e.g. Video Editor)'
  AFTER role;
`;

console.log("Adding company_users.menu_role_name...");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting:", err);
    process.exit(1);
  }
  connection.query(sql, (err) => {
    if (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.errno === 1060) {
        console.log("✓ Column menu_role_name already exists — nothing to do.");
        connection.end();
        process.exit(0);
        return;
      }
      console.error("Error:", err);
      connection.end();
      process.exit(1);
    }
    console.log("✓ Column menu_role_name added successfully.");
    connection.end();
  });
});
