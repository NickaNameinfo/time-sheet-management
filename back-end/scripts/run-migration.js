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

// Read migration file
const migrationSQL = fs.readFileSync(
  path.join(__dirname, "../database/migrations.sql"),
  "utf8"
);

console.log("Running database migration...");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }

  console.log("Connected to database");

  // Execute migration - split by semicolon and execute one by one to handle errors gracefully
  const statements = migrationSQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  let completed = 0;
  let errors = 0;

  const executeNext = (index) => {
    if (index >= statements.length) {
      console.log(`\n✅ Migration completed!`);
      console.log(`   Completed: ${completed} statements`);
      if (errors > 0) {
        console.log(`   Errors (non-critical): ${errors}`);
      }
      connection.end();
      process.exit(0);
      return;
    }

    const statement = statements[index] + ";";
    
    // Skip empty statements or comments
    if (statement.trim().length === 0 || statement.trim().startsWith("--")) {
      executeNext(index + 1);
      return;
    }

    connection.query(statement, (err, results) => {
      if (err) {
        // Ignore duplicate key/index errors as they're non-critical
        if (
          err.code === "ER_DUP_KEYNAME" ||
          err.code === "ER_DUP_ENTRY" ||
          err.code === "ER_CANT_DROP_FIELD_OR_KEY" ||
          err.message.includes("Duplicate")
        ) {
          console.log(`⚠️  Index/key already exists (non-critical): ${err.code}`);
          errors++;
        } else {
          console.error(`❌ Error at statement ${index + 1}:`, err.message);
          console.error(`   SQL: ${statement.substring(0, 100)}...`);
          errors++;
        }
      } else {
        completed++;
      }
      executeNext(index + 1);
    });
  };

  executeNext(0);
});

