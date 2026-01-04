-- Create project_plans table for project planning with time periods
CREATE TABLE IF NOT EXISTS `project_plans` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `plan_name` VARCHAR(255) NOT NULL,
  `project_id` INT NOT NULL,
  `time_period` ENUM('weekly', 'monthly', '3_months', '6_months', '9_months', 'yearly') NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `total_allotted_hours` DECIMAL(10,2) NOT NULL,
  `description` TEXT,
  `status` ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'draft',
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `employee`(`id`) ON DELETE SET NULL,
  INDEX `idx_project_id` (`project_id`),
  INDEX `idx_time_period` (`time_period`),
  INDEX `idx_status` (`status`)
);

-- Create project_plan_employees table for employee assignments
CREATE TABLE IF NOT EXISTS `project_plan_employees` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `project_plan_id` INT NOT NULL,
  `employee_id` INT NOT NULL,
  `allotted_hours` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `assigned_date` DATE NOT NULL,
  `status` ENUM('assigned', 'active', 'completed', 'removed') DEFAULT 'assigned',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_plan_id`) REFERENCES `project_plans`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_plan_employee` (`project_plan_id`, `employee_id`),
  INDEX `idx_project_plan_id` (`project_plan_id`),
  INDEX `idx_employee_id` (`employee_id`)
);
