-- Referral: referrer gets 2% of referred user's first investment (after admin approval = withdrawable)
-- Run on same DB as challenge_users / investments

-- Add referrer link to challenge_users (referrals identified by referrer email at signup)
-- Run once; if column already exists, skip the first ALTER.
ALTER TABLE challenge_users
  ADD COLUMN referred_by_user_id INT NULL COMMENT 'challenge_users.id of referrer' AFTER address;
ALTER TABLE challenge_users
  ADD CONSTRAINT fk_challenge_users_referred_by
  FOREIGN KEY (referred_by_user_id) REFERENCES challenge_users(id) ON DELETE SET NULL;

-- Referral earnings: one row per referred user's first investment
CREATE TABLE IF NOT EXISTS referral_earnings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrer_user_id INT NOT NULL COMMENT 'who gets the 2%',
  referred_user_id INT NOT NULL COMMENT 'user who made first investment',
  investment_id INT NOT NULL COMMENT 'the first investment that triggered this',
  first_investment_amount DECIMAL(15,2) NOT NULL,
  referral_amount DECIMAL(15,2) NOT NULL COMMENT '2% of first_investment_amount',
  status ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED') DEFAULT 'PENDING_APPROVAL',
  approved_at TIMESTAMP NULL,
  approved_by INT NULL COMMENT 'admin user id if needed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_user_id) REFERENCES challenge_users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_user_id) REFERENCES challenge_users(id) ON DELETE CASCADE,
  FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE,
  UNIQUE KEY uk_referral_per_investment (investment_id),
  INDEX idx_referrer_status (referrer_user_id, status),
  INDEX idx_status (status)
);
