-- Add status column to project table
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'project' 
  AND COLUMN_NAME = 'status'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE project ADD COLUMN status VARCHAR(50) DEFAULT "active" AFTER allotatedHours',
  'SELECT "Column status already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
