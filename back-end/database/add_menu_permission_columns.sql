-- Add granular permission columns to menu_permissions table
-- These columns store JSON arrays of roles that have each permission type

-- Check and add view_permission column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'menu_permissions' 
  AND COLUMN_NAME = 'view_permission'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE menu_permissions ADD COLUMN view_permission JSON NULL AFTER allowed_roles',
  'SELECT "Column view_permission already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add add_permission column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'menu_permissions' 
  AND COLUMN_NAME = 'add_permission'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE menu_permissions ADD COLUMN add_permission JSON NULL AFTER view_permission',
  'SELECT "Column add_permission already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add edit_permission column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'menu_permissions' 
  AND COLUMN_NAME = 'edit_permission'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE menu_permissions ADD COLUMN edit_permission JSON NULL AFTER add_permission',
  'SELECT "Column edit_permission already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add delete_permission column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'menu_permissions' 
  AND COLUMN_NAME = 'delete_permission'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE menu_permissions ADD COLUMN delete_permission JSON NULL AFTER edit_permission',
  'SELECT "Column delete_permission already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add all_permission column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'menu_permissions' 
  AND COLUMN_NAME = 'all_permission'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE menu_permissions ADD COLUMN all_permission JSON NULL AFTER delete_permission',
  'SELECT "Column all_permission already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Initialize permissions: Copy allowed_roles to view_permission for existing records
UPDATE menu_permissions 
SET view_permission = allowed_roles,
    add_permission = allowed_roles,
    edit_permission = allowed_roles,
    delete_permission = allowed_roles,
    all_permission = allowed_roles
WHERE view_permission IS NULL;
