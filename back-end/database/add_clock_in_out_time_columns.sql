-- Add clockInTime and clockOutTime columns to workdetails table
-- These columns will store the exact datetime when employee clocked in and clocked out

-- Add clockInTime column to workdetails table
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'workdetails'
  AND column_name = 'clockInTime';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE workdetails ADD COLUMN clockInTime DATETIME NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add clockOutTime column to workdetails table
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'workdetails'
  AND column_name = 'clockOutTime';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE workdetails ADD COLUMN clockOutTime DATETIME NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
