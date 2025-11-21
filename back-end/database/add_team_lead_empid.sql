-- Add EMPID column to team_lead table
-- This column is used to link team leads to employees

-- Check if EMPID column exists, if not add it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'team_lead'
  AND column_name = 'EMPID';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE team_lead ADD COLUMN EMPID INT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

