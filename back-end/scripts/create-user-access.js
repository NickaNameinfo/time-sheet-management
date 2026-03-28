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

const sqlTable = fs.readFileSync(path.join(__dirname, "../database/create_user_access.sql"), "utf8");
const sqlMenu = fs.readFileSync(path.join(__dirname, "../database/add_user_access_menu.sql"), "utf8");

console.log("Creating user_access_requests table and User Access menu...");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
  connection.query(sqlTable, (err1) => {
    if (err1) {
      console.error("Error creating user_access_requests table:", err1);
      connection.end();
      process.exit(1);
    }
    console.log("✓ user_access_requests table created.");
    connection.query(sqlMenu, (err2) => {
      if (err2) {
        console.error("Error adding User Access menu:", err2);
      } else {
        console.log("✓ User Access menu added.");
      }
      connection.end();
    });
  });
});
