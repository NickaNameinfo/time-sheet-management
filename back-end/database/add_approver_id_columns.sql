-- Add approverId column to leavedetails, ot_records, and workdetails tables
-- This column stores the ID of the approver who approved/rejected the request

-- Add approverId to leavedetails table
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'leavedetails'
  AND column_name = 'approverId';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE leavedetails ADD COLUMN approverId INT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add approverId to ot_records table (if it doesn't exist, note: approved_by already exists)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'ot_records'
  AND column_name = 'approverId';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE ot_records ADD COLUMN approverId INT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add approverId to workdetails table
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'workdetails'
  AND column_name = 'approverId';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE workdetails ADD COLUMN approverId INT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add approverId to compoff table
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'compoff'
  AND column_name = 'approverId';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE compoff ADD COLUMN approverId INT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

