/**
 * Deactivate Team Leads + HR Management menu rows in menu_permissions.
 * Run from back-end: node scripts/remove-hr-team-leads-menus.js
 * Applies to primary DB and company DB (if COMPANY_DB_* is set).
 */
import { query, companyQuery } from "../config/database.js";

const sql = `
UPDATE menu_permissions
SET is_active = FALSE
WHERE menu_key IN ('manage_team_leads', 'manage_hr')
`.trim();

async function runOn(label, qFn) {
  await qFn(sql);
  console.log(`✅ ${label}: deactivated manage_team_leads, manage_hr`);
}

async function main() {
  try {
    await runOn("Primary DB", query);
    if (process.env.COMPANY_DB_NAME || process.env.COMPANY_DB_HOST) {
      await runOn("Company DB", companyQuery);
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
