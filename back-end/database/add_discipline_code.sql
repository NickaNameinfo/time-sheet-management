-- Add discipline_code to discipline table for use in project creation (e.g. Marketing - 101, Sales - 201)
-- Run add-discipline-code.js to apply (handles column/key existence).

ALTER TABLE `discipline`
  ADD COLUMN `discipline_code` VARCHAR(50) NULL COMMENT 'Code used in project creation (e.g. 101, 201)' AFTER `discipline`;

-- Ensure unique code for upsert
ALTER TABLE `discipline` ADD UNIQUE KEY `unique_discipline_code` (`discipline_code`);

-- Seed discipline rules: Name - Code (used when creating projects)
INSERT INTO `discipline` (`discipline`, `discipline_code`) VALUES
('Marketing', '101'),
('Sales', '201'),
('Website Development', '301'),
('Nickname Products', '401'),
('Sales websites', '501')
ON DUPLICATE KEY UPDATE `discipline` = VALUES(`discipline`);
