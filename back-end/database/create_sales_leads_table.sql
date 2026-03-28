-- Sales leads (demo booking form: Full Name, Work Email, Company Name, Company Size, Phone Number)
CREATE TABLE IF NOT EXISTS `sales_leads` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(255) NOT NULL,
  `work_email` VARCHAR(255) NOT NULL,
  `company_name` VARCHAR(255) NOT NULL,
  `company_size` VARCHAR(50) NULL COMMENT 'e.g. 1–50, 51–200, 201–500',
  `phone_number` VARCHAR(50) NULL,
  `created_by` INT NULL COMMENT 'employee.id who added the lead',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sales_leads_created_by` (`created_by`),
  KEY `idx_sales_leads_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
