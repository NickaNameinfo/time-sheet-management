-- Add Sales/CRM menu permissions to menu_permissions table
-- This script adds the Sales parent menu and its submenus

-- Parent Menu: Sales
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) 
VALUES ('sales', 'Sales', '/Dashboard/Sales', 'Business', NULL, '["Admin"]', TRUE, 5)
ON DUPLICATE KEY UPDATE 
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);

-- Submenu: Add CRM Date
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) 
VALUES ('add_crm_date', 'Add CRM Date', '/Dashboard/Sales/AddCrmDate', 'CalendarToday', 'sales', '["Admin"]', TRUE, 5.1)
ON DUPLICATE KEY UPDATE 
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);

-- Submenu: CRM List
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) 
VALUES ('crm_list', 'CRM List', '/Dashboard/Sales/CrmList', 'List', 'sales', '["Admin"]', TRUE, 5.2)
ON DUPLICATE KEY UPDATE 
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);

-- Submenu: CRM Summary
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) 
VALUES ('crm_summary', 'CRM Summary', '/Dashboard/Sales/CrmSummary', 'Assessment', 'sales', '["Admin"]', TRUE, 5.3)
ON DUPLICATE KEY UPDATE 
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);

