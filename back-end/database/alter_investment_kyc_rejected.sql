-- Add REJECTED status and admin_note for KYC (run once)
-- Step 1: Add admin_note column
ALTER TABLE investment_kyc ADD COLUMN admin_note TEXT NULL COMMENT 'Admin note when rejected/cancelled';

-- Step 2: Allow REJECTED status (use VARCHAR so we don't depend on ENUM order)
ALTER TABLE investment_kyc MODIFY COLUMN status VARCHAR(32) NOT NULL DEFAULT 'PENDING_VERIFICATION';
