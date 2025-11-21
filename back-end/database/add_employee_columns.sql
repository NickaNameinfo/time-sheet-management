-- Add missing columns to employee table
-- These columns are used in the AddEmployee form but don't exist in the table

-- Check if relievingDate column exists, if not add it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'employee'
  AND column_name = 'relievingDate';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE employee ADD COLUMN relievingDate DATE NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if permanentDate column exists, if not add it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'employee'
  AND column_name = 'permanentDate';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE employee ADD COLUMN permanentDate DATE NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

