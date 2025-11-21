-- Create compoff table for Compensatory Off requests
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

