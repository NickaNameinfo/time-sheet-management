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

const migrationSQL = fs.readFileSync(
  path.join(__dirname, "../database/create_investment_tables.sql"),
  "utf8"
);

console.log("Running investment database migration...");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }

  console.log("Connected to database");

  const statements = migrationSQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let completed = 0;
  let errors = 0;

  const executeNext = (index) => {
    if (index >= statements.length) {
      console.log("\n✅ Investment migration completed!");
      console.log(`   Completed: ${completed} statements`);
      if (errors > 0) console.log(`   Errors (non-critical): ${errors}`);
      connection.end();
      process.exit(errors > 0 ? 1 : 0);
      return;
    }

    const statement = statements[index] + ";";
    if (statement.trim().length === 0) {
      executeNext(index + 1);
      return;
    }

    connection.query(statement, (err, results) => {
      if (err) {
        if (
          err.code === "ER_DUP_KEYNAME" ||
          err.code === "ER_DUP_ENTRY" ||
          err.code === "ER_CANT_DROP_FIELD_OR_KEY" ||
          err.message.includes("Duplicate")
        ) {
          console.log(`⚠️  Skip (already exists): ${err.code}`);
          errors++;
        } else {
          console.error(`❌ Error at statement ${index + 1}:`, err.message);
          console.error(`   SQL: ${statement.substring(0, 80)}...`);
          errors++;
        }
      } else {
        completed++;
        const preview = statement.replace(/\s+/g, " ").substring(0, 60);
        console.log(`   OK: ${preview}...`);
      }
      executeNext(index + 1);
    });
  };

  executeNext(0);
});
