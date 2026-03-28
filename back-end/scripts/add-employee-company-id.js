import { query } from "../config/database.js";

async function run() {
  try {
    const check = await query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'employee' AND COLUMN_NAME = 'company_id'"
    );
    if (check.length > 0) {
      console.log("✓ employee.company_id already exists.");
      process.exit(0);
      return;
    }
    await query("ALTER TABLE employee ADD COLUMN company_id INT NULL DEFAULT NULL");
    console.log("✓ employee.company_id added.");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
  process.exit(0);
}
run();
