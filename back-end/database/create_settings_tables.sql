-- Create missing settings tables
-- These tables are required for the application to work properly

-- Discipline Table
CREATE TABLE IF NOT EXISTS `discipline` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `discipline` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Designation Table
CREATE TABLE IF NOT EXISTS `designation` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `designation` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Area of Work Table
CREATE TABLE IF NOT EXISTS `areaofwork` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `areaofwork` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Variation Table
CREATE TABLE IF NOT EXISTS `variation` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `variation` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Settings/Updates Table
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `updateTitle` VARCHAR(255) NOT NULL,
  `UpdateDisc` TEXT,
  `Announcements` BOOLEAN DEFAULT FALSE,
  `Circular` BOOLEAN DEFAULT FALSE,
  `Gallery` BOOLEAN DEFAULT FALSE,
  `ViewExcel` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert some default values (optional)
INSERT IGNORE INTO `discipline` (`discipline`) VALUES 
('Civil Engineering'),
('Mechanical Engineering'),
('Electrical Engineering'),
('Architecture'),
('Project Management');

INSERT IGNORE INTO `designation` (`designation`) VALUES 
('Engineer'),
('Senior Engineer'),
('Project Manager'),
('Team Lead'),
('Architect'),
('Designer');

INSERT IGNORE INTO `areaofwork` (`areaofwork`) VALUES 
('Design'),
('Construction'),
('Planning'),
('Quality Control'),
('Site Management');

INSERT IGNORE INTO `variation` (`variation`) VALUES 
('Original'),
('Variation 1'),
('Variation 2'),
('Revision'),
('Amendment');

