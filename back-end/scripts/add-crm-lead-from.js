import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log("Starting migration: Add lead_from to crm_entries...");

    const migrationFile = path.join(__dirname, "..", "database", "add_crm_lead_from.sql");
    const sql = fs.readFileSync(migrationFile, "utf8");

    // Remove comment lines first so a statement isn't dropped
    // when it starts with "--" and also contains valid SQL after newline.
    const cleanedSql = sql
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("--"))
      .join(" ");

    const statements = cleanedSql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (let i = 0; i < statements.length; i += 1) {
      const statement = statements[i];
      try {
        await query(statement);
        console.log(`✓ Statement ${i + 1}/${statements.length} executed`);
      } catch (error) {
        if (error.code === "ER_DUP_FIELDNAME") {
          console.log("⚠ Column lead_from already exists. Skipping.");
        } else if (error.code === "ER_DUP_KEYNAME") {
          console.log("⚠ Index idx_lead_from already exists. Skipping.");
        } else if (
          error.code === "ER_KEY_COLUMN_DOES_NOT_EXITS" ||
          String(error.message || "").includes("doesn't exist in table")
        ) {
          console.log("⚠ lead_from column not found while creating index. Run migration again.");
        } else {
          throw error;
        }
      }
    }

    console.log("✅ Migration completed: crm_entries.lead_from is ready.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message || error);
    process.exit(1);
  }
}

runMigration();
