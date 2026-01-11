import { query } from "../config/database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the SQL file
const sqlPath = path.join(__dirname, "../database/create_crm_table.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

// Split the SQL file into individual statements
const statements = sql
  .split(";")
  .map((stmt) => stmt.trim())
  .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

async function runMigration() {
  console.log("Creating CRM table...\n");

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
        // If table already exists, that's okay
        if (error.code === "ER_TABLE_EXISTS_ERROR" || error.message.includes("already exists")) {
          console.log(`⚠ Table already exists (this is okay)\n`);
        } else {
          console.error(`✗ Error executing statement ${i + 1}:`, error.message);
          console.error(`  SQL: ${statement.substring(0, 100)}...\n`);
        }
      }
    }

    // Verify table was created
    console.log("Verifying table creation...\n");
    const verifySql = `
      SELECT COUNT(*) as count 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'crm_entries'
    `;
    const result = await query(verifySql);
    
    if (result[0]?.count > 0) {
      console.log("✅ CRM table created successfully!");
      console.log("   Table: crm_entries");
      console.log("   The CRM API endpoints are now ready to use.");
    } else {
      console.log("⚠️  Warning: Table verification failed");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();

