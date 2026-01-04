-- Create App Settings Table
-- This table stores overall application settings like country, language, and currency

CREATE TABLE IF NOT EXISTS `app_settings` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `setting_key` VARCHAR(100) UNIQUE NOT NULL,
  `setting_value` TEXT,
  `description` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default app settings
INSERT INTO `app_settings` (`setting_key`, `setting_value`, `description`) VALUES
('country', 'UAE', 'Default country for the application'),
('language', 'en', 'Default language (en, ar, hi, etc.)'),
('currency', 'AED', 'Default currency code'),
('currency_symbol', 'د.إ', 'Currency symbol'),
('date_format', 'DD/MM/YYYY', 'Date format preference'),
('time_format', '24h', 'Time format (12h or 24h)')
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;
