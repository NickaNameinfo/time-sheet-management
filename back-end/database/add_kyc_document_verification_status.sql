-- Document verification status (admin can set after reviewing uploaded Aadhaar/PAN docs)
ALTER TABLE investment_kyc
  ADD COLUMN document_verification_status VARCHAR(32) NULL DEFAULT 'PENDING' COMMENT 'PENDING, VERIFIED' AFTER pan_document_path;
