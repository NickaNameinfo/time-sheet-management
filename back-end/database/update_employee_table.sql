-- Update employee table to add missing columns
-- This ensures the employee table has all required columns for the application

-- Add relievingDate column if it doesn't exist
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

-- Add permanentDate column if it doesn't exist
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

