import { query } from "../config/database.js";

const columnsToModify = [
  'orderId',
  'positionNumber',
  'subPositionNumber',
  'taskJobNo',
  'referenceNo'
];

async function runMigration() {
  console.log("Starting migration: Making project fields nullable...\n");

  try {
    for (let i = 0; i < columnsToModify.length; i++) {
      const columnName = columnsToModify[i];
      
      try {
        console.log(`Modifying column ${i + 1}/${columnsToModify.length}: ${columnName}...`);
        const sql = `ALTER TABLE \`project\` MODIFY COLUMN \`${columnName}\` VARCHAR(150) NULL`;
        await query(sql);
        console.log(`✓ Column ${columnName} is now nullable\n`);
      } catch (error) {
        // If column modification fails, check the reason
        if (error.code === "ER_BAD_FIELD_ERROR") {
          console.log(`⚠ Column ${columnName} doesn't exist, skipping...\n`);
        } else if (error.message.includes("already") || error.message.includes("Duplicate")) {
          console.log(`⚠ ${error.message} (this is okay)\n`);
        } else {
          console.error(`✗ Error modifying column ${columnName}:`, error.message);
          console.error(`  Code: ${error.code}\n`);
          // Continue with other columns even if one fails
        }
      }
    }

    // Verify the changes
    console.log("Verifying changes...\n");
    const verifySql = `
      SELECT COLUMN_NAME, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'project' 
      AND COLUMN_NAME IN (?, ?, ?, ?, ?)
    `;
    const results = await query(verifySql, columnsToModify);
    
    console.log("Column Status:");
    results.forEach(r => {
      const status = r.IS_NULLABLE === 'YES' ? 'NULLABLE ✓' : 'NOT NULL ✗';
      console.log(`  ${r.COLUMN_NAME}: ${status}`);
    });

    const allNullable = results.every(r => r.IS_NULLABLE === 'YES');
    
    if (allNullable && results.length === columnsToModify.length) {
      console.log("\n✅ Migration completed successfully!");
      console.log("   All columns are now nullable.");
    } else {
      console.log("\n⚠️  Migration completed with some issues.");
      console.log("   Some columns may still be NOT NULL.");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();

