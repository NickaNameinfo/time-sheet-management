-- Add document upload paths for Aadhaar and PAN card (KYC)
ALTER TABLE investment_kyc
  ADD COLUMN aadhaar_document_path VARCHAR(500) NULL COMMENT 'Uploaded Aadhaar card image path' AFTER pan_encrypted;
ALTER TABLE investment_kyc
  ADD COLUMN pan_document_path VARCHAR(500) NULL COMMENT 'Uploaded PAN card image path' AFTER aadhaar_document_path;
