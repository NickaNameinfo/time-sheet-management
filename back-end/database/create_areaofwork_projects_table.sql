-- Create junction table for many-to-many relationship between areaofwork and projects
-- This table links areas of work to multiple projects

CREATE TABLE IF NOT EXISTS `areaofwork_projects` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `areaofwork_id` INT NOT NULL,
  `project_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`areaofwork_id`) REFERENCES `areaofwork`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_areaofwork_project` (`areaofwork_id`, `project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create index for better query performance
CREATE INDEX `idx_areaofwork_id` ON `areaofwork_projects`(`areaofwork_id`);
CREATE INDEX `idx_project_id` ON `areaofwork_projects`(`project_id`);
