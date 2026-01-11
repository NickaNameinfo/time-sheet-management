-- Create CRM entries table
-- This table stores CRM (Customer Relationship Management) entries with dates and client information

CREATE TABLE IF NOT EXISTS `crm_entries` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `crmDate` DATE NOT NULL,
  `clientName` VARCHAR(255) NOT NULL,
  `contactPerson` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_crm_date` (`crmDate`),
  INDEX `idx_client_name` (`clientName`),
  INDEX `idx_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

