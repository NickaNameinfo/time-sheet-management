-- Add Roles menu permission to menu_permissions table

INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) 
VALUES ('settings_roles', 'Roles', '/Dashboard/Roles', NULL, 'settings', '["Admin"]', TRUE, 42.5)
ON DUPLICATE KEY UPDATE 
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);
