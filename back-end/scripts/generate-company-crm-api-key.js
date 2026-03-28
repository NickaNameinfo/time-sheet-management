import crypto from "crypto";
import { query } from "../config/database.js";

const companyCode = String(process.argv[2] || "").trim();
const keyLabel = String(process.argv[3] || "website").trim();
const allowedOrigins = String(process.argv[4] || "").trim() || null;
const expiresAt = String(process.argv[5] || "").trim() || null; // optional: "2027-01-01 00:00:00"

if (!companyCode) {
  console.error("Usage: node scripts/generate-company-crm-api-key.js <company_code> [label] [allowed_origins_csv] [expires_at]");
  process.exit(1);
}

const hashApiKey = (key) =>
  crypto.createHash("sha256").update(String(key || "").trim(), "utf8").digest("hex");

async function run() {
  try {
    await query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const companies = await query(
      "SELECT id, company_code, company_name FROM companies WHERE LOWER(company_code) = LOWER(?) LIMIT 1",
      [companyCode]
    );
    if (companies.length === 0) {
      console.error(`Company not found: ${companyCode}`);
      process.exit(1);
    }
    const company = companies[0];

    const plainKey = `crm_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = hashApiKey(plainKey);

    await query(
      `INSERT INTO company_crm_api_keys
       (company_id, key_label, key_hash, allowed_origins, is_active, expires_at)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [company.id, keyLabel || null, keyHash, allowedOrigins, expiresAt]
    );

    console.log("✅ Company CRM API key generated");
    console.log(`Company: ${company.company_name} (${company.company_code})`);
    console.log(`Label: ${keyLabel}`);
    console.log(`API Key (save now, shown once): ${plainKey}`);
    console.log(`Allowed origins: ${allowedOrigins || "(none)"}`);
    console.log(`Expires at: ${expiresAt || "(never)"}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to generate key:", error.message || error);
    process.exit(1);
  }
}

run();
