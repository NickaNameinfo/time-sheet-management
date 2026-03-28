/**
 * Migration: Rename "Sales" menu to "Sales Department" and ensure all sales items are under it.
 * Run from back-end: node scripts/rename-sales-to-sales-department.js
 */
import { query } from "../config/database.js";

async function run() {
  console.log("Updating Sales menu to Sales Department...\n");

  try {
    const updated = await query(
      "UPDATE menu_permissions SET menu_title = ? WHERE menu_key = ?",
      ["Sales Department", "sales"]
    );
    console.log("✓ Parent menu 'sales' title set to 'Sales Department'");

    const children = await query(
      "UPDATE menu_permissions SET parent_menu = 'sales' WHERE menu_key IN (?, ?, ?, ?)",
      ["add_crm_date", "crm_list", "crm_summary", "lead_list"]
    );
    console.log("✓ Sales submenus (Add CRM Date, CRM List, CRM Summary, Lead List) set under Sales Department");

    const verify = await query(
      "SELECT menu_key, menu_title, parent_menu FROM menu_permissions WHERE menu_key = 'sales' OR parent_menu = 'sales' ORDER BY display_order"
    );
    console.log("\nSales Department menu in DB:");
    verify.forEach((r) => {
      console.log(`  ${r.menu_key}: ${r.menu_title} (parent: ${r.parent_menu || "root"})`);
    });
    console.log("\n✅ Done.");
    process.exit(0);
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      console.log("menu_permissions table does not exist; nothing to update.");
      process.exit(0);
    }
    console.error(err);
    process.exit(1);
  }
}

run();
