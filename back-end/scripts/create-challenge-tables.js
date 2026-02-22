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
  path.join(__dirname, "../database/create_challenge_tables.sql"),
  "utf8"
);

console.log("Creating challenge tables...");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
  connection.query(sqlFile, (err) => {
    if (err) {
      console.error("Error creating challenge tables:", err);
      connection.end();
      process.exit(1);
    }
    console.log("✅ Challenge tables created successfully!");
    connection.end();
    process.exit(0);
  });
});
