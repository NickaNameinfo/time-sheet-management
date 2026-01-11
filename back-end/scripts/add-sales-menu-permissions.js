import { query } from "../config/database.js";

const menuItems = [
  {
    menu_key: 'sales',
    menu_title: 'Sales',
    menu_path: '/Dashboard/Sales',
    menu_icon: 'Business',
    parent_menu: null,
    allowed_roles: JSON.stringify(['Admin']),
    is_active: true,
    display_order: 5
  },
  {
    menu_key: 'add_crm_date',
    menu_title: 'Add CRM Date',
    menu_path: '/Dashboard/Sales/AddCrmDate',
    menu_icon: 'CalendarToday',
    parent_menu: 'sales',
    allowed_roles: JSON.stringify(['Admin']),
    is_active: true,
    display_order: 5.1
  },
  {
    menu_key: 'crm_list',
    menu_title: 'CRM List',
    menu_path: '/Dashboard/Sales/CrmList',
    menu_icon: 'List',
    parent_menu: 'sales',
    allowed_roles: JSON.stringify(['Admin']),
    is_active: true,
    display_order: 5.2
  },
  {
    menu_key: 'crm_summary',
    menu_title: 'CRM Summary',
    menu_path: '/Dashboard/Sales/CrmSummary',
    menu_icon: 'Assessment',
    parent_menu: 'sales',
    allowed_roles: JSON.stringify(['Admin']),
    is_active: true,
    display_order: 5.3
  }
];

async function runMigration() {
  console.log("Adding Sales menu permissions...\n");

  try {
    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];
      
      try {
        console.log(`Adding menu item ${i + 1}/${menuItems.length}: ${item.menu_title}...`);
        
        const sql = `
          INSERT INTO menu_permissions 
          (menu_key, menu_title, menu_path, menu_icon, parent_menu, allowed_roles, is_active, display_order) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            menu_title = VALUES(menu_title),
            menu_path = VALUES(menu_path),
            menu_icon = VALUES(menu_icon),
            parent_menu = VALUES(parent_menu),
            allowed_roles = VALUES(allowed_roles),
            is_active = VALUES(is_active),
            display_order = VALUES(display_order)
        `;
        
        await query(sql, [
          item.menu_key,
          item.menu_title,
          item.menu_path,
          item.menu_icon,
          item.parent_menu,
          item.allowed_roles,
          item.is_active,
          item.display_order
        ]);
        
        console.log(`✓ ${item.menu_title} added successfully\n`);
      } catch (error) {
        console.error(`✗ Error adding ${item.menu_title}:`, error.message);
        // Continue with other items
      }
    }

    // Verify the items were added
    console.log("Verifying menu items...\n");
    const verifySql = `
      SELECT menu_key, menu_title, menu_path, parent_menu 
      FROM menu_permissions 
      WHERE menu_key IN ('sales', 'add_crm_date', 'crm_list', 'crm_summary')
      ORDER BY display_order
    `;
    const results = await query(verifySql);
    
    console.log("Sales Menu Items in Database:");
    results.forEach(r => {
      console.log(`  ${r.menu_key}: ${r.menu_title} (${r.menu_path}) - Parent: ${r.parent_menu || 'None'}`);
    });

    if (results.length === 4) {
      console.log("\n✅ Sales menu permissions added successfully!");
      console.log("   The Sales menu should now appear in the sidebar with 3 submenus.");
    } else {
      console.log(`\n⚠️  Warning: Expected 4 menu items, but found ${results.length}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();

