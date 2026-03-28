import { query } from "../config/database.js";

async function run() {
  try {
    // Check if table exists
    const tables = await query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trail_version_access'"
    );
    if (!tables || tables.length === 0) {
      console.log("Creating trail_version_access table (it does not exist)...");
      await query(`
        CREATE TABLE IF NOT EXISTS trail_version_access (
          id INT PRIMARY KEY AUTO_INCREMENT,
          employee_id INT NULL,
          company_user_id INT NULL DEFAULT NULL,
          started_at DATETIME NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_employee_trail (employee_id),
          UNIQUE KEY unique_company_user_trail (company_user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("✓ trail_version_access table created with company_user_id support.");
      process.exit(0);
      return;
    }

    const cols = await query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trail_version_access'"
    );
    const names = (cols || []).map((r) => r.COLUMN_NAME);
    if (names.includes("company_user_id")) {
      console.log("✓ trail_version_access.company_user_id already exists.");
      process.exit(0);
      return;
    }
    await query("ALTER TABLE trail_version_access MODIFY COLUMN employee_id INT NULL");
    await query("ALTER TABLE trail_version_access ADD COLUMN company_user_id INT NULL DEFAULT NULL AFTER employee_id");
    await query("ALTER TABLE trail_version_access ADD UNIQUE KEY unique_company_user_trail (company_user_id)");
    console.log("✓ trail_version_access updated for company users.");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
  process.exit(0);
}
run();
