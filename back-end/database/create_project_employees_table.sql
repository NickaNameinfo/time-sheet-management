-- Create project_employees junction table for many-to-many relationship
-- This table links employees to projects

CREATE TABLE IF NOT EXISTS project_employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  employee_id INT NOT NULL,
  assigned_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_employee (project_id, employee_id)
);

