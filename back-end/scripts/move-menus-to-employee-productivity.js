/**
 * Migration: Add "Employee Productivity" parent menu and move employee work-related items under it.
 * Items moved: Employee Dashboard, Team Lead Dashboard, Project Work Details, Time Management, Productivity, Apply Leave, Comp-Off.
 * Run from back-end: node scripts/move-menus-to-employee-productivity.js
 */
import { query } from "../config/database.js";

const PARENT = {
  menu_key: "employee_productivity",
  menu_title: "Employee Productivity",
  menu_path: "/Dashboard/EmployeeHome",
  menu_icon: "TrendingUp",
  allowed_roles: '["TL", "Admin", "Employee", "HR"]',
  display_order: 50,
};

const CHILD_KEYS = [
  "employee_dashboard",
  "teamlead_dashboard",
  "project_work_details",
  "time_management",
  "productivity",
  "apply_leave",
  "compoff",
];

async function run() {
  console.log("Adding Employee Productivity menu and moving employee work items under it...\n");

  try {
    const existing = await query(
      "SELECT id FROM menu_permissions WHERE menu_key = ?",
      [PARENT.menu_key]
    );
    if (existing.length === 0) {
      await query(
        `INSERT INTO menu_permissions (menu_key, menu_title, menu_path, menu_icon, parent_menu, allowed_roles, is_active, display_order)
         VALUES (?, ?, ?, ?, NULL, ?, TRUE, ?)`,
        [
          PARENT.menu_key,
          PARENT.menu_title,
          PARENT.menu_path,
          PARENT.menu_icon,
          PARENT.allowed_roles,
          PARENT.display_order,
        ]
      );
      console.log("✓ Parent menu 'Employee Productivity' created.");
    } else {
      await query(
        "UPDATE menu_permissions SET menu_title = ?, menu_path = ?, menu_icon = ?, allowed_roles = ?, display_order = ? WHERE menu_key = ?",
        [
          PARENT.menu_title,
          PARENT.menu_path,
          PARENT.menu_icon,
          PARENT.allowed_roles,
          PARENT.display_order,
          PARENT.menu_key,
        ]
      );
      console.log("✓ Parent menu 'Employee Productivity' updated.");
    }

    let order = 50.1;
    for (const key of CHILD_KEYS) {
      await query(
        "UPDATE menu_permissions SET parent_menu = ?, display_order = ? WHERE menu_key = ?",
        ["employee_productivity", order, key]
      );
      console.log(`  ✓ ${key} → under Employee Productivity`);
      order += 0.1;
    }

    const verify = await query(
      "SELECT menu_key, menu_title, parent_menu, display_order FROM menu_permissions WHERE menu_key = ? OR parent_menu = ? ORDER BY display_order",
      [PARENT.menu_key, PARENT.menu_key]
    );
    console.log("\nEmployee Productivity menu in DB:");
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
