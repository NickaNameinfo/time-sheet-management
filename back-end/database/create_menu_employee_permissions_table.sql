-- Create menu_employee_permissions table
-- This table stores employee-specific menu permissions

CREATE TABLE IF NOT EXISTS `menu_employee_permissions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `menu_permission_id` INT NOT NULL,
  `employee_id` INT NOT NULL,
  `view_permission` BOOLEAN DEFAULT FALSE,
  `add_permission` BOOLEAN DEFAULT FALSE,
  `edit_permission` BOOLEAN DEFAULT FALSE,
  `delete_permission` BOOLEAN DEFAULT FALSE,
  `all_permission` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`menu_permission_id`) REFERENCES `menu_permissions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE CASCADE,
  UNIQUE KEY unique_menu_employee (`menu_permission_id`, `employee_id`),
  INDEX idx_menu_permission_id (`menu_permission_id`),
  INDEX idx_employee_id (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
