-- Withdrawal requests for early withdrawal (before 15 days): 3% deduction, admin approval required
CREATE TABLE IF NOT EXISTS investment_withdrawal_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  investment_id INT NOT NULL,
  requested_amount DECIMAL(15,2) NOT NULL COMMENT 'Total before deduction',
  deduction_percent DECIMAL(5,2) NOT NULL DEFAULT 3.00,
  deduction_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount_after_deduction DECIMAL(15,2) NOT NULL COMMENT 'Amount user will receive',
  days_held INT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING_APPROVAL' COMMENT 'PENDING_APPROVAL, APPROVED, REJECTED',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by INT NULL COMMENT 'Admin user id',
  admin_note TEXT NULL,
  settlement_status VARCHAR(32) NULL COMMENT 'PENDING, PROCESSING, SETTLED',
  settlement_date DATE NULL COMMENT 'Expected or actual settlement date',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES challenge_users(id) ON DELETE CASCADE,
  FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_investment_status (investment_id, status),
  INDEX idx_requested_at (requested_at)
);
