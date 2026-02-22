-- Investment Module: KYC, Plans, Investments, Withdrawals
-- Run this on the same database as challenge_users (e.g. signup)

-- KYC / Profile verification (one row per user)
CREATE TABLE IF NOT EXISTS investment_kyc (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE COMMENT 'challenge_users.id',
  bank_holder_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  account_number_encrypted VARCHAR(500) NOT NULL,
  ifsc_code VARCHAR(20) NOT NULL,
  branch VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  aadhaar_encrypted VARCHAR(500) NOT NULL,
  pan_encrypted VARCHAR(500) NOT NULL,
  aadhaar_document_path VARCHAR(500) NULL COMMENT 'Uploaded Aadhaar card image path',
  pan_document_path VARCHAR(500) NULL COMMENT 'Uploaded PAN card image path',
  document_verification_status VARCHAR(32) NULL DEFAULT 'PENDING' COMMENT 'PENDING, VERIFIED',
  status ENUM('PENDING_VERIFICATION', 'VERIFIED') DEFAULT 'PENDING_VERIFICATION',
  verified_at TIMESTAMP NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES challenge_users(id) ON DELETE CASCADE,
  INDEX idx_user_status (user_id, status)
);

-- Predefined investment plans (seeded)
CREATE TABLE IF NOT EXISTS investment_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT 'e.g. Plan A, Below 5000',
  category VARCHAR(50) NOT NULL COMMENT 'below_5000 | above_5000',
  min_amount DECIMAL(15,2) NOT NULL,
  max_amount DECIMAL(15,2) NOT NULL,
  interest_percentage DECIMAL(5,2) NOT NULL,
  lockin_days INT NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_plan (category, min_amount, lockin_days),
  INDEX idx_category_active (category, is_active)
);

-- User investments
CREATE TABLE IF NOT EXISTS investments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  interest_percentage DECIMAL(5,2) NOT NULL,
  lockin_days INT NOT NULL,
  start_date DATE NOT NULL,
  maturity_date DATE NOT NULL,
  status ENUM('ACTIVE', 'MATURED', 'WITHDRAWN', 'CANCELLED') DEFAULT 'ACTIVE',
  transaction_id VARCHAR(255) NULL COMMENT 'Payment gateway reference',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES challenge_users(id) ON DELETE RESTRICT,
  FOREIGN KEY (plan_id) REFERENCES investment_plans(id),
  INDEX idx_user_status (user_id, status),
  INDEX idx_maturity (maturity_date),
  INDEX idx_transaction (transaction_id)
);

-- Withdrawals (one per investment when withdrawn)
CREATE TABLE IF NOT EXISTS withdrawals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  investment_id INT NOT NULL UNIQUE,
  principal_amount DECIMAL(15,2) NOT NULL,
  interest_earned DECIMAL(15,2) NOT NULL DEFAULT 0,
  withdrawal_amount DECIMAL(15,2) NOT NULL,
  withdrawn_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (investment_id) REFERENCES investments(id),
  INDEX idx_withdrawn_at (withdrawn_at)
);

-- Notifications for investment module (challenge_user scope)
CREATE TABLE IF NOT EXISTS investment_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES challenge_users(id) ON DELETE CASCADE,
  INDEX idx_user_unread (user_id, read_at)
);

-- Audit log for compliance (KYC submit, verify, invest, withdraw)
CREATE TABLE IF NOT EXISTS investment_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(50) NOT NULL COMMENT 'KYC_SUBMIT, KYC_VERIFIED, INVESTMENT_CREATED, WITHDRAWAL',
  entity_type VARCHAR(50) NULL COMMENT 'kyc, investment, withdrawal',
  entity_id INT NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_action (user_id, action),
  INDEX idx_created (created_at)
);

-- Seed investment plans (idempotent). Minimum investment amount: ₹5.
INSERT INTO investment_plans (name, category, min_amount, max_amount, interest_percentage, lockin_days) VALUES
('Below ₹5,000', 'below_5000', 5.00, 4999.00, 0.50, 30),
('Plan A - 15 Days', 'above_5000', 5000.00, 999999999.00, 1.00, 15),
('Plan B - 30 Days', 'above_5000', 5000.00, 999999999.00, 2.00, 30)
ON DUPLICATE KEY UPDATE name = VALUES(name), interest_percentage = VALUES(interest_percentage), max_amount = VALUES(max_amount);
