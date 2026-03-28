/**
 * Add Investment menu permissions (parent + submenus).
 * Run from back-end: node scripts/add-investment-menu-permissions.js
 */
import { query } from "../config/database.js";

const menuItems = [
  { menu_key: "investment", menu_title: "Investment", menu_path: "/Dashboard/Investment", menu_icon: "Savings", parent_menu: null, allowed_roles: '["Admin"]', display_order: 6 },
  { menu_key: "investment_kyc", menu_title: "KYC Status", menu_path: "/Dashboard/Investment/KYC", menu_icon: "Savings", parent_menu: "investment", allowed_roles: '["Admin"]', display_order: 6.1 },
  { menu_key: "investment_kyc_submit", menu_title: "Submit / Update KYC", menu_path: "/Dashboard/Investment/KYC/Submit", menu_icon: "Person", parent_menu: "investment", allowed_roles: '["Admin"]', display_order: 6.2 },
  { menu_key: "investment_myself_reports", menu_title: "My Self Reports", menu_path: "/Dashboard/Investment/MySelfReports", menu_icon: "Assessment", parent_menu: "investment", allowed_roles: '["Admin"]', display_order: 6.3 },
  { menu_key: "investment_reports", menu_title: "Investment Reports", menu_path: "/Dashboard/Investment/Reports", menu_icon: "TrendingUp", parent_menu: "investment", allowed_roles: '["Admin"]', display_order: 6.4 },
  { menu_key: "investment_update_kyc_status", menu_title: "Update KYC Status", menu_path: "/Dashboard/Investment/UpdateKycStatus", menu_icon: "CheckCircle", parent_menu: "investment", allowed_roles: '["Admin"]', display_order: 6.5 },
  { menu_key: "investment_admin_user_reports", menu_title: "User Reports", menu_path: "/Dashboard/Investment/AdminUserReports", menu_icon: "People", parent_menu: "investment", allowed_roles: '["Admin"]', display_order: 6.6 },
  { menu_key: "investment_withdrawal_requests", menu_title: "Withdrawal Requests", menu_path: "/Dashboard/Investment/WithdrawalRequests", menu_icon: "PendingActions", parent_menu: "investment", allowed_roles: '["Admin"]', display_order: 6.7 },
  { menu_key: "investment_referral_earnings", menu_title: "Referral – Approve", menu_path: "/Dashboard/Investment/ReferralEarnings", menu_icon: "People", parent_menu: "investment", allowed_roles: '["Admin"]', display_order: 6.8 },
  { menu_key: "investment_referral_reports", menu_title: "Referral Reports", menu_path: "/Dashboard/Investment/ReferralReports", menu_icon: "Assessment", parent_menu: "investment", allowed_roles: '["Admin"]', display_order: 6.9 },
];

async function run() {
  console.log("Adding Investment menu permissions...\n");
  try {
    for (const item of menuItems) {
      await query(
        `INSERT INTO menu_permissions (menu_key, menu_title, menu_path, menu_icon, parent_menu, allowed_roles, is_active, display_order)
         VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)
         ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon),
         parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order)`,
        [item.menu_key, item.menu_title, item.menu_path, item.menu_icon, item.parent_menu, item.allowed_roles, item.display_order]
      );
      console.log(`  ✓ ${item.menu_title}`);
    }
    const verify = await query(
      "SELECT menu_key, menu_title, parent_menu FROM menu_permissions WHERE menu_key = 'investment' OR parent_menu = 'investment' ORDER BY display_order"
    );
    console.log("\nInvestment menu in DB:", verify.length, "items");
    process.exit(0);
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      console.log("menu_permissions table does not exist.");
      process.exit(0);
    }
    console.error(err);
    process.exit(1);
  }
}

run();
