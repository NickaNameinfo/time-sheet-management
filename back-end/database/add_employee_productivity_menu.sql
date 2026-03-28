-- Add Employee Productivity parent menu and move all employee work-related items under it
-- Run this to group: Employee Dashboard, Time Management, Project Work Details, Productivity, Apply Leave, Comp-Off

-- Parent Menu: Employee Productivity
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`)
VALUES ('employee_productivity', 'Employee Productivity', '/Dashboard/EmployeeHome', 'TrendingUp', NULL, '["TL", "Admin", "Employee", "HR"]', TRUE, 50)
ON DUPLICATE KEY UPDATE
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);

-- Move employee work-related items under Employee Productivity
UPDATE `menu_permissions` SET `parent_menu` = 'employee_productivity', `display_order` = 50.1 WHERE `menu_key` = 'employee_dashboard';
UPDATE `menu_permissions` SET `parent_menu` = 'employee_productivity', `display_order` = 50.2 WHERE `menu_key` = 'teamlead_dashboard';
UPDATE `menu_permissions` SET `parent_menu` = 'employee_productivity', `display_order` = 50.3 WHERE `menu_key` = 'project_work_details';
UPDATE `menu_permissions` SET `parent_menu` = 'employee_productivity', `display_order` = 50.4 WHERE `menu_key` = 'time_management';
UPDATE `menu_permissions` SET `parent_menu` = 'employee_productivity', `display_order` = 50.5 WHERE `menu_key` = 'productivity';
UPDATE `menu_permissions` SET `parent_menu` = 'employee_productivity', `display_order` = 50.6 WHERE `menu_key` = 'apply_leave';
UPDATE `menu_permissions` SET `parent_menu` = 'employee_productivity', `display_order` = 50.7 WHERE `menu_key` = 'compoff';
