-- Add salary, ID proof, and parent details columns to employee table

-- Add salary column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'employee' 
  AND COLUMN_NAME = 'salary'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE employee ADD COLUMN salary DECIMAL(10,2) NULL',
  'SELECT "Column salary already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add id_proof column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'employee' 
  AND COLUMN_NAME = 'id_proof'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE employee ADD COLUMN id_proof VARCHAR(500) NULL',
  'SELECT "Column id_proof already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add parent details columns
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'employee' 
  AND COLUMN_NAME = 'father_name'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE employee ADD COLUMN father_name VARCHAR(255) NULL',
  'SELECT "Column father_name already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'employee' 
  AND COLUMN_NAME = 'mother_name'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE employee ADD COLUMN mother_name VARCHAR(255) NULL',
  'SELECT "Column mother_name already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'employee' 
  AND COLUMN_NAME = 'parent_contact'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE employee ADD COLUMN parent_contact VARCHAR(50) NULL',
  'SELECT "Column parent_contact already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'employee' 
  AND COLUMN_NAME = 'parent_address'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE employee ADD COLUMN parent_address TEXT NULL',
  'SELECT "Column parent_address already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
