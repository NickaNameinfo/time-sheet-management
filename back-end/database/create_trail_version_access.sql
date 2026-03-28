-- Trail version access: one row per employee when they start trial (email in allowlist).
-- started_at = when trial began; expires_at = started_at + admin_trail_version_days.

CREATE TABLE IF NOT EXISTS `trail_version_access` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `employee_id` INT NOT NULL,
  `started_at` DATETIME NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_employee_trail` (`employee_id`),
  CONSTRAINT `fk_trail_employee` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
