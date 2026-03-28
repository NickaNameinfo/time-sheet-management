-- Add lead source field to CRM entries
ALTER TABLE `crm_entries`
  ADD COLUMN `lead_from` VARCHAR(120) DEFAULT NULL AFTER `notes`;

CREATE INDEX `idx_lead_from` ON `crm_entries` (`lead_from`);
