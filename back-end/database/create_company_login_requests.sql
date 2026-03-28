-- Pending company profile login requests (company admin requests → Super Admin approves).
CREATE TABLE IF NOT EXISTS `company_login_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('company_admin','company_user') NOT NULL DEFAULT 'company_user',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `requested_by_company_user_id` INT NULL,
  `reviewed_at` DATETIME NULL,
  `reviewed_by_email` VARCHAR(255) NULL,
  `reject_reason` VARCHAR(500) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_clr_company` (`company_id`),
  KEY `idx_clr_status` (`status`),
  KEY `idx_clr_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
