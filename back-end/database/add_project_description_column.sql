-- Add description column to project table
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'project' 
  AND COLUMN_NAME = 'description'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE project ADD COLUMN description TEXT NULL AFTER subDivision',
  'SELECT "Column description already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
