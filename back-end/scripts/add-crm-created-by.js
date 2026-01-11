import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log("Starting migration: Add created_by column to crm_entries table...");

    const migrationFile = path.join(
      __dirname,
      "..",
      "database",
      "add_crm_created_by.sql"
    );

    const sql = fs.readFileSync(migrationFile, "utf8");

    // Remove comment lines and split SQL statements by semicolon
    const lines = sql.split("\n");
    const cleanedLines = lines
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith("--"));
    const cleanedSql = cleanedLines.join(" ");

    // Split SQL statements by semicolon and filter out empty statements
    const statements = cleanedSql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    console.log(`Executing ${statements.length} SQL statement(s)...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\nExecuting statement ${i + 1}:`);
      console.log(statement.substring(0, 100) + "...");

      try {
        await query(statement);
        console.log(`✓ Statement ${i + 1} executed successfully`);
      } catch (error) {
        // Check if column already exists
        if (error.code === "ER_DUP_FIELDNAME") {
          console.log(`⚠ Column 'created_by' already exists. Skipping...`);
        } else if (error.code === "ER_DUP_KEYNAME") {
          console.log(`⚠ Index 'idx_created_by' already exists. Skipping...`);
        } else if (error.code === "ER_KEY_COLUMN_DOES_NOT_EXITS") {
          console.log(`⚠ Column doesn't exist yet. This might be expected if running statements out of order.`);
          throw error;
        } else {
          throw error;
        }
      }
    }

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigration();
