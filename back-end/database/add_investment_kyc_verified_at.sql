-- Record whether KYC was verified at time of investment (NULL = invested before KYC verified).
-- Run once. If column already exists, ignore the error.
ALTER TABLE investments
  ADD COLUMN kyc_verified_at_investment TIMESTAMP NULL
  COMMENT 'When KYC was VERIFIED at investment time; NULL = KYC not verified at time of payment';
