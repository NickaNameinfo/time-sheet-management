/**
 * Deactivate Time Management under Productivity Tracking (menu_permissions.time_management).
 * Run: node scripts/remove-time-management-menu.js
 */
import { query, companyQuery } from "../config/database.js";

const sql = `
UPDATE menu_permissions
SET is_active = FALSE
WHERE menu_key = 'time_management'
`.trim();

async function main() {
  try {
    await query(sql);
    console.log("✅ Primary DB: time_management menu deactivated");
    if (process.env.COMPANY_DB_NAME || process.env.COMPANY_DB_HOST) {
      await companyQuery(sql);
      console.log("✅ Company DB: time_management menu deactivated");
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
