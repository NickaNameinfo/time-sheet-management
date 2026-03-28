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

const sql = fs.readFileSync(path.join(__dirname, "../database/seed_super_admin.sql"), "utf8");

console.log("Seeding super admin (admin@nickname.com)...");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
  connection.query(sql, (err2) => {
    if (err2) {
      console.error("Error seeding super admin:", err2);
      connection.end();
      process.exit(1);
    }
    console.log("✓ Super admin email set: admin@nickname.com");
    connection.end();
  });
});
