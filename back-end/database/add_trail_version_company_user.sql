-- Support trail version for company users (admin login from company).
-- employee_id becomes nullable; company_user_id added for company-user trial tracking.

-- Make employee_id nullable (for company-user-only rows)
ALTER TABLE `trail_version_access` MODIFY COLUMN `employee_id` INT NULL;

-- Add company_user_id (optional FK to company_users.id)
ALTER TABLE `trail_version_access` ADD COLUMN `company_user_id` INT NULL DEFAULT NULL AFTER `employee_id`;

-- One trial row per company user
ALTER TABLE `trail_version_access` ADD UNIQUE KEY `unique_company_user_trail` (`company_user_id`);
