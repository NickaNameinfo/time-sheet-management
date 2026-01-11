-- Add created_by column to crm_entries table
-- This column stores the employee.id of the user who created the CRM entry

ALTER TABLE `crm_entries` ADD COLUMN `created_by` INT DEFAULT NULL AFTER `notes`;

ALTER TABLE `crm_entries` ADD INDEX `idx_created_by` (`created_by`);

-- Add foreign key constraint (optional, can be added if employee table exists)
-- ALTER TABLE `crm_entries` 
-- ADD CONSTRAINT `fk_crm_created_by` 
-- FOREIGN KEY (`created_by`) REFERENCES `employee` (`id`) 
-- ON DELETE SET NULL ON UPDATE CASCADE;

