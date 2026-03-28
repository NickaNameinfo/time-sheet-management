-- Optional: run if server cannot auto-migrate. Matches Settings → Roles role_name for Menu Permissions sidebar.
ALTER TABLE company_users
  ADD COLUMN menu_role_name VARCHAR(100) NULL DEFAULT NULL
  COMMENT 'Sidebar: must match menu_permissions role tags (e.g. Video Editor)'
  AFTER role;
