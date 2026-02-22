-- Add settlement tracking to withdrawal requests (admin can update status and date). Run once.
ALTER TABLE investment_withdrawal_requests
  ADD COLUMN settlement_status VARCHAR(32) NULL COMMENT 'PENDING, PROCESSING, SETTLED' AFTER admin_note;
ALTER TABLE investment_withdrawal_requests
  ADD COLUMN settlement_date DATE NULL COMMENT 'Expected or actual settlement date' AFTER settlement_status;
