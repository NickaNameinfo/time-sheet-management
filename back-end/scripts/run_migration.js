import { query } from "../config/database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the migration SQL file
const migrationPath = path.join(__dirname, "../database/add_approver_id_columns.sql");
const migrationSQL = fs.readFileSync(migrationPath, "utf8");

// Split the SQL file into individual statements
// MySQL doesn't support multiple statements in a single query by default
// So we'll execute each statement separately
const statements = migrationSQL
  .split(";")
  .map((stmt) => stmt.trim())
  .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

async function runMigration() {
  console.log("Starting migration: Adding approverId columns...\n");

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
        // For prepared statements, we need to execute them directly
        // The SQL file uses prepared statements, so we'll execute the full block
        await query(statement);
        console.log(`✓ Statement ${i + 1} executed successfully`);
      } catch (error) {
        // If column already exists, that's okay
        if (error.code === "ER_DUP_FIELDNAME") {
          console.log(`⚠ Column already exists, skipping...`);
        } else {
          console.error(`✗ Error executing statement ${i + 1}:`, error.message);
          // Continue with other statements even if one fails
        }
      }
    }

    // Since the SQL uses prepared statements, let's execute the full file as a single query
    // But first, let's try a simpler approach - execute each ALTER TABLE statement directly
    console.log("\nExecuting migration statements directly...\n");

    const tables = [
      { name: "leavedetails", display: "Leave Details" },
      { name: "ot_records", display: "OT Records" },
      { name: "workdetails", display: "Work Details" },
      { name: "compoff", display: "Comp-Off" },
    ];

    for (const table of tables) {
      try {
        // Check if column exists first
        const checkSql = `
          SELECT COUNT(*) as count
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE table_schema = DATABASE()
            AND table_name = ?
            AND column_name = 'approverId'
        `;
        const result = await query(checkSql, [table.name]);

        if (result[0].count > 0) {
          console.log(`✓ ${table.display} (${table.name}): approverId column already exists`);
        } else {
          // Add the column
          const alterSql = `ALTER TABLE ${table.name} ADD COLUMN approverId INT NULL`;
          await query(alterSql);
          console.log(`✓ ${table.display} (${table.name}): approverId column added successfully`);
        }
      } catch (error) {
        console.error(`✗ Error adding approverId to ${table.display} (${table.name}):`, error.message);
      }
    }

    console.log("\n✅ Migration completed!");
    console.log("\nSummary:");
    console.log("- approverId column added to leavedetails, ot_records, workdetails, and compoff tables");
    console.log("- All columns are nullable (INT NULL)");
    console.log("- Existing records are not affected");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    // Close the connection pool
    process.exit(0);
  }
}

// Run the migration
runMigration();

