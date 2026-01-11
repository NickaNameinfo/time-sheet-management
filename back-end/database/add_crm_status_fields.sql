-- Add status and scheduleDate columns to crm_entries table

ALTER TABLE `crm_entries` 
ADD COLUMN `status` VARCHAR(50) DEFAULT 'New' AFTER `notes`,
ADD COLUMN `scheduleDate` DATE DEFAULT NULL AFTER `status`;

-- Add index on status for filtering
CREATE INDEX `idx_status` ON `crm_entries` (`status`);

