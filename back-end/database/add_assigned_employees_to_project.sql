-- Add assignedEmployees column to project table
-- This column stores employee IDs as a JSON array directly in the project table

-- Check if assignedEmployees column exists, if not add it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'project'
  AND column_name = 'assignedEmployees';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE project ADD COLUMN assignedEmployees TEXT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

