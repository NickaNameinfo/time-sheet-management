import mysql from "mysql";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
  console.log("Connected to database");

  const sql = fs.readFileSync(
    path.join(__dirname, "../database/create_compoff_table.sql"),
    "utf8"
  );

  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error creating compoff table:", err);
      connection.end();
      process.exit(1);
    }
    console.log("compoff table created successfully");
    connection.end();
  });
});

