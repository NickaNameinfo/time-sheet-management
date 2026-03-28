-- Rename Sales parent menu to "Sales Department" and ensure all sales items are under it
-- Run this on existing databases to move/rename sales menus to Sales Department

UPDATE `menu_permissions`
SET `menu_title` = 'Sales Department'
WHERE `menu_key` = 'sales';

-- Ensure all sales-related submenus have parent_menu = 'sales' (Sales Department)
UPDATE `menu_permissions`
SET `parent_menu` = 'sales'
WHERE `menu_key` IN ('add_crm_date', 'crm_list', 'crm_summary', 'lead_list');
