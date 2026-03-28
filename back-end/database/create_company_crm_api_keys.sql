CREATE TABLE IF NOT EXISTS company_crm_api_keys (
  id INT NOT NULL AUTO_INCREMENT,
  company_id INT NOT NULL,
  key_label VARCHAR(120) NULL,
  key_hash CHAR(64) NOT NULL,
  allowed_origins TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ccak_company (company_id),
  KEY idx_ccak_active (is_active),
  CONSTRAINT fk_ccak_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
