-- Hide Team Leads and HR Management from the sidebar (menu_permissions).
-- Safe to re-run. Apply on company DB and primary DB as needed:
--   mysql ... < back-end/database/remove_hr_team_leads_menus.sql

UPDATE `menu_permissions`
SET `is_active` = FALSE
WHERE `menu_key` IN ('manage_team_leads', 'manage_hr');
