-- Add missing menu permissions
-- This script adds menu items that exist in routes/components but are missing from menu_permissions table

-- Main Menu Items
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
-- Project Planning (Main feature)
('project_planning', 'Project Planning', '/Dashboard/project-planning', 'AccountTree', NULL, '["Admin"]', TRUE, 4),

-- Team Leads Management (Main feature)
('manage_team_leads', 'Manage Team Leads', '/Dashboard/lead', 'People', NULL, '["Admin"]', TRUE, 2.5),

-- HR Management (Main feature)
('manage_hr', 'Manage HR', '/Dashboard/hr', 'People', NULL, '["Admin"]', TRUE, 2.6),

-- Parent Menus (needed for nested menu structure)
-- Note: These parent menus are referenced by submenu items but were missing from the database
('reports', 'Reports', '/Dashboard/Reports', 'Assessment', NULL, '["Admin", "HR", "TL"]', TRUE, 19),
('settings', 'Settings', '/Dashboard/Settings', 'Settings', NULL, '["Admin"]', TRUE, 39),
-- Note: 'approvals' parent menu is referenced by leave_details and compoff_details submenu items
-- However, 'approval_center' already exists as a main menu item. This might need review.
('approvals', 'Approvals', '/Dashboard/Approvals', 'CheckCircle', NULL, '["Admin", "HR", "TL"]', TRUE, 17.5),

-- Settings Submenu Items
('settings_overtime_rules', 'Overtime Rules', '/Dashboard/Settings/OvertimeRules', NULL, 'settings', '["Admin"]', TRUE, 45.5),
('settings_app_settings', 'App Settings', '/Dashboard/Settings/AppSettings', NULL, 'settings', '["Admin"]', TRUE, 46)

ON DUPLICATE KEY UPDATE 
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);

-- Note: The following routes are typically accessed via buttons/actions and may not need separate menu items:
-- - /Dashboard/create/:id? (Add Employee - accessed from Manage Employees)
-- - /Dashboard/addLead (Add Team Lead - accessed from Manage Team Leads)
-- - /Dashboard/addHr (Add HR - accessed from Manage HR)
-- - /Dashboard/addProject/:id? (Add Project - accessed from Manage Projects)
-- - /Dashboard/AddProjectDetails (Add Project Details - accessed from Time Management/Project Work Details)
-- - /Dashboard/profile (Profile - accessed from user menu/dropdown)
-- - /Employee/Profile, /TeamLead/Profile, /Hr/Profile (Profile - accessed from user menu/dropdown)

