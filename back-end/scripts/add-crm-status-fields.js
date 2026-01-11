import { query } from "../config/database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the SQL file
const sqlPath = path.join(__dirname, "../database/add_crm_status_fields.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

// Split the SQL file into individual statements
const statements = sql
  .split(";")
  .map((stmt) => stmt.trim())
  .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

async function runMigration() {
  console.log("Adding status and scheduleDate fields to CRM table...\n");

  try {
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements
      if (!statement || statement.trim().length === 0) {
        continue;
      }

      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await query(statement);
        console.log(`✓ Statement ${i + 1} executed successfully\n`);
      } catch (error) {
        // If column already exists, that's okay
        if (error.code === "ER_DUP_FIELDNAME" || error.message.includes("Duplicate column name")) {
          console.log(`⚠ Column already exists (this is okay)\n`);
        } else if (error.code === "ER_DUP_KEYNAME" || error.message.includes("Duplicate key name")) {
          console.log(`⚠ Index already exists (this is okay)\n`);
        } else {
          console.error(`✗ Error executing statement ${i + 1}:`, error.message);
          console.error(`  SQL: ${statement.substring(0, 100)}...\n`);
        }
      }
    }

    // Verify columns were added
    console.log("Verifying columns...\n");
    const verifySql = `
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'crm_entries'
      AND COLUMN_NAME IN ('status', 'scheduleDate')
    `;
    const result = await query(verifySql);
    
    if (result.length > 0) {
      console.log("✅ Status fields added successfully!");
      result.forEach(col => {
        console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} (default: ${col.COLUMN_DEFAULT || 'NULL'})`);
      });
    } else {
      console.log("⚠️  Warning: Could not verify columns");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();

