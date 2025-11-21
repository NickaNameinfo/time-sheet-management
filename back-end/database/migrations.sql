-- Phase 1 & Phase 2 Database Schema
-- Skip GPS and Face Recognition features

-- ============================================
-- PHASE 1: Overtime, Leave Balance, Payroll
-- ============================================

-- Overtime Rules Table
CREATE TABLE IF NOT EXISTS ot_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  country VARCHAR(50) DEFAULT 'UAE',
  daily_hours_limit DECIMAL(5,2) DEFAULT 8.00,
  weekly_hours_limit DECIMAL(5,2) DEFAULT 48.00,
  friday_multiplier DECIMAL(3,2) DEFAULT 1.50,
  holiday_multiplier DECIMAL(3,2) DEFAULT 2.00,
  night_shift_multiplier DECIMAL(3,2) DEFAULT 1.25,
  night_shift_start TIME DEFAULT '22:00:00',
  night_shift_end TIME DEFAULT '06:00:00',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Overtime Records Table
CREATE TABLE IF NOT EXISTS ot_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  work_detail_id INT,
  attendance_date DATE NOT NULL,
  regular_hours DECIMAL(5,2) DEFAULT 0,
  ot_hours DECIMAL(5,2) DEFAULT 0,
  ot_type VARCHAR(50), -- 'daily', 'weekly', 'friday', 'holiday', 'night'
  ot_rate DECIMAL(10,2),
  ot_amount DECIMAL(10,2),
  approval_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by INT,
  approved_at DATETIME,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
  FOREIGN KEY (work_detail_id) REFERENCES workdetails(id) ON DELETE SET NULL
);

-- Leave Balance Table
CREATE TABLE IF NOT EXISTS leave_balances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  leave_type VARCHAR(50) NOT NULL, -- 'annual', 'sick', 'casual', 'emergency'
  balance DECIMAL(5,2) DEFAULT 0,
  accrued DECIMAL(5,2) DEFAULT 0,
  used DECIMAL(5,2) DEFAULT 0,
  year INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_leave_year (employee_id, leave_type, year)
);

-- Leave Accruals Table
CREATE TABLE IF NOT EXISTS leave_accruals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  accrual_date DATE NOT NULL,
  accrual_amount DECIMAL(5,2) NOT NULL,
  accrual_type VARCHAR(50), -- 'monthly', 'yearly', 'manual'
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE
);

-- Leave Documents Table (for medical certificates, etc.)
CREATE TABLE IF NOT EXISTS leave_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  leave_id INT NOT NULL,
  document_type VARCHAR(50), -- 'medical_certificate', 'other'
  document_path VARCHAR(500),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leave_id) REFERENCES leavedetails(id) ON DELETE CASCADE
);

-- Compensatory Off Table
CREATE TABLE IF NOT EXISTS compoff (
  id INT PRIMARY KEY AUTO_INCREMENT,
  leaveType VARCHAR(50),
  leaveFrom DATE,
  reason TEXT,
  employeeName VARCHAR(255),
  employeeId INT,
  workHours DECIMAL(5,2),
  eligibility VARCHAR(50),
  leaveStatus VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_employee_id (employeeId),
  INDEX idx_leave_status (leaveStatus)
);

-- ============================================
-- PHASE 2: Shifts, Budget, Billing, Productivity
-- ============================================

-- Shifts Table
CREATE TABLE IF NOT EXISTS shifts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INT DEFAULT 0, -- in minutes
  break_start TIME,
  is_night_shift BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Shift Assignments Table
CREATE TABLE IF NOT EXISTS shift_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  shift_id INT NOT NULL,
  assignment_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
);

-- Shift Swap Requests Table
CREATE TABLE IF NOT EXISTS shift_swaps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  requester_id INT NOT NULL,
  swap_with_id INT NOT NULL,
  original_shift_date DATE NOT NULL,
  swap_shift_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by INT,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES employee(id) ON DELETE CASCADE,
  FOREIGN KEY (swap_with_id) REFERENCES employee(id) ON DELETE CASCADE
);

-- Project Budgets Table
CREATE TABLE IF NOT EXISTS project_budgets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  budget_amount DECIMAL(10,2) NOT NULL,
  budget_hours DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'AED',
  budget_type VARCHAR(50), -- 'total', 'monthly', 'quarterly'
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

-- Project Costs Table
CREATE TABLE IF NOT EXISTS project_costs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  cost_date DATE NOT NULL,
  employee_cost DECIMAL(10,2) DEFAULT 0,
  overhead_cost DECIMAL(10,2) DEFAULT 0,
  material_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  hours_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

-- Billing Rates Table
CREATE TABLE IF NOT EXISTS billing_rates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT,
  designation VARCHAR(255),
  discipline_code VARCHAR(255),
  project_id INT,
  hourly_rate DECIMAL(10,2) NOT NULL,
  ot_rate_multiplier DECIMAL(3,2) DEFAULT 1.50,
  effective_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE SET NULL
);

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'UAE',
  payment_terms VARCHAR(255), -- 'net_30', 'net_15', 'due_on_receipt'
  currency VARCHAR(10) DEFAULT 'AED',
  tax_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Link Projects to Clients (Check if column exists first)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'project'
  AND column_name = 'client_id';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE project ADD COLUMN client_id INT',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key if it doesn't exist
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'project'
  AND COLUMN_NAME = 'client_id'
  AND REFERENCED_TABLE_NAME = 'clients';

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE project ADD FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(255) UNIQUE NOT NULL,
  client_id INT NOT NULL,
  project_id INT,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'AED',
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE SET NULL
);

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  work_detail_id INT,
  description VARCHAR(500),
  hours DECIMAL(10,2) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (work_detail_id) REFERENCES workdetails(id) ON DELETE SET NULL
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50), -- 'cash', 'bank_transfer', 'cheque', 'credit_card'
  reference_number VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Productivity Metrics Table
CREATE TABLE IF NOT EXISTS productivity_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  metric_date DATE NOT NULL,
  total_hours DECIMAL(5,2) DEFAULT 0,
  productive_hours DECIMAL(5,2) DEFAULT 0,
  idle_time_minutes INT DEFAULT 0,
  tasks_completed INT DEFAULT 0,
  tasks_assigned INT DEFAULT 0,
  productivity_score DECIMAL(5,2) DEFAULT 0, -- percentage
  task_completion_rate DECIMAL(5,2) DEFAULT 0, -- percentage
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_date (employee_id, metric_date)
);

-- Enhanced Approval Workflows Table
CREATE TABLE IF NOT EXISTS approval_workflows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'leave', 'overtime', 'timesheet', 'expense'
  approval_levels JSON NOT NULL, -- [{"level": 1, "role": "TL", "required": true}, ...]
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Approval History Table
CREATE TABLE IF NOT EXISTS approval_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  approver_id INT NOT NULL,
  approval_level INT NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'pending'
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (approver_id) REFERENCES employee(id) ON DELETE CASCADE
);

-- Report Schedules Table
CREATE TABLE IF NOT EXISTS report_schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_type VARCHAR(100) NOT NULL, -- 'daily', 'weekly', 'monthly', 'custom'
  report_name VARCHAR(255) NOT NULL,
  recipients JSON NOT NULL, -- [{"email": "user@example.com", "role": "admin"}]
  schedule_config JSON NOT NULL, -- {"frequency": "daily", "time": "09:00", "day": "monday"}
  is_active BOOLEAN DEFAULT TRUE,
  last_sent_at DATETIME,
  next_send_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- 'clock_in_reminder', 'shift_start', 'leave_approval'
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_notification (employee_id, notification_type)
);

-- Insert Default OT Rules for UAE
INSERT INTO ot_rules (country, daily_hours_limit, weekly_hours_limit, friday_multiplier, holiday_multiplier, night_shift_multiplier)
VALUES ('UAE', 8.00, 48.00, 1.50, 2.00, 1.25)
ON DUPLICATE KEY UPDATE country = country;

-- Insert Default Shifts
INSERT INTO shifts (name, start_time, end_time, break_duration, is_night_shift) VALUES
('Morning Shift', '08:00:00', '17:00:00', 60, FALSE),
('Evening Shift', '14:00:00', '23:00:00', 60, FALSE),
('Night Shift', '22:00:00', '06:00:00', 60, TRUE)
ON DUPLICATE KEY UPDATE name = name;

-- Create Indexes for Performance
-- Note: These will fail silently if indexes already exist (handled by migration script)
-- Indexes are created only if they don't exist to avoid duplicate key errors

-- Check and create index for ot_records
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'ot_records' AND index_name = 'idx_ot_records_employee_date');
SET @sql = IF(@index_exists = 0, 
  'CREATE INDEX idx_ot_records_employee_date ON ot_records(employee_id, attendance_date)', 
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and create index for leave_balances
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'leave_balances' AND index_name = 'idx_leave_balance_employee_year');
SET @sql = IF(@index_exists = 0, 
  'CREATE INDEX idx_leave_balance_employee_year ON leave_balances(employee_id, year)', 
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and create index for shift_assignments
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'shift_assignments' AND index_name = 'idx_shift_assignments_employee_date');
SET @sql = IF(@index_exists = 0, 
  'CREATE INDEX idx_shift_assignments_employee_date ON shift_assignments(employee_id, assignment_date)', 
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and create index for project_costs
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'project_costs' AND index_name = 'idx_project_costs_project_date');
SET @sql = IF(@index_exists = 0, 
  'CREATE INDEX idx_project_costs_project_date ON project_costs(project_id, cost_date)', 
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and create index for invoices
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'invoices' AND index_name = 'idx_invoices_client_status');
SET @sql = IF(@index_exists = 0, 
  'CREATE INDEX idx_invoices_client_status ON invoices(client_id, status)', 
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and create index for productivity_metrics
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'productivity_metrics' AND index_name = 'idx_productivity_employee_date');
SET @sql = IF(@index_exists = 0, 
  'CREATE INDEX idx_productivity_employee_date ON productivity_metrics(employee_id, metric_date)', 
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and create index for approval_history
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'approval_history' AND index_name = 'idx_approval_history_entity');
SET @sql = IF(@index_exists = 0, 
  'CREATE INDEX idx_approval_history_entity ON approval_history(entity_type, entity_id)', 
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- Update Existing Tables (Employee)
-- ============================================

-- Add relievingDate column to employee table if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'employee'
  AND column_name = 'relievingDate';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE employee ADD COLUMN relievingDate DATE NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add permanentDate column to employee table if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'employee'
  AND column_name = 'permanentDate';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE employee ADD COLUMN permanentDate DATE NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add EMPID column to team_lead table if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'team_lead'
  AND column_name = 'EMPID';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE team_lead ADD COLUMN EMPID INT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add tlID column to project table if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'project'
  AND column_name = 'tlID';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE project ADD COLUMN tlID INT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

