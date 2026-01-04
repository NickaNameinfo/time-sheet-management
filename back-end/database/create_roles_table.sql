-- Create roles table
-- This table stores available employee roles

CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `role_name` VARCHAR(100) NOT NULL UNIQUE,
  `role_display_name` VARCHAR(255) NOT NULL,
  `role_color` VARCHAR(50) DEFAULT 'default',
  `is_active` BOOLEAN DEFAULT TRUE,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active),
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default roles
INSERT INTO `roles` (`role_name`, `role_display_name`, `role_color`, `is_active`, `display_order`) VALUES
('Employee', 'Employee', 'default', TRUE, 1),
('TL', 'Team Lead', 'info', TRUE, 2),
('HR', 'HR', 'warning', TRUE, 3),
('Admin', 'Admin', 'error', TRUE, 4)
ON DUPLICATE KEY UPDATE 
  role_display_name = VALUES(role_display_name),
  role_color = VALUES(role_color),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);
