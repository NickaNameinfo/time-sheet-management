-- Add tlID column to project table
-- This column is used to link projects to team leads by their ID

-- Check if tlID column exists, if not add it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'project'
  AND column_name = 'tlID';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE project ADD COLUMN tlID INT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

