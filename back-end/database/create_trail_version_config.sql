-- Trail version configuration: who gets trial access and for how many days.
-- Replaces storing this in app_settings JSON; used by getAdminTrailVersionCheck.

CREATE TABLE IF NOT EXISTS `trail_version_config` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `type` ENUM('company','email') NOT NULL COMMENT 'company = by company_id; email = by email',
  `company_id` INT NULL DEFAULT NULL,
  `company_name` VARCHAR(255) NULL DEFAULT NULL,
  `email` VARCHAR(255) NULL DEFAULT NULL,
  `days` INT NOT NULL DEFAULT 30,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_type` (`type`),
  KEY `idx_company_id` (`company_id`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
