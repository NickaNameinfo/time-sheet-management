-- Add optional company_id to employee for trial-by-company (Trail Version from company list).
-- Run once: node scripts/add-employee-company-id.js (or execute this SQL in MySQL 8.0.12+).
-- For older MySQL, run only: ALTER TABLE employee ADD COLUMN company_id INT NULL DEFAULT NULL;
ALTER TABLE `employee` ADD COLUMN `company_id` INT NULL DEFAULT NULL;
