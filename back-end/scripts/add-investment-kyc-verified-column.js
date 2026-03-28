import { query } from "../config/database.js";

const sql = `
  ALTER TABLE investments
  ADD COLUMN kyc_verified_at_investment TIMESTAMP NULL
  COMMENT 'When KYC was VERIFIED at investment time; NULL = KYC not verified at time of payment'
`;

async function run() {
  try {
    await query(sql);
    console.log("✅ investments.kyc_verified_at_investment column added.");
    process.exit(0);
  } catch (err) {
    if (err.code === "ER_DUP_FIELD_NAME") {
      console.log("✅ Column kyc_verified_at_investment already exists.");
      process.exit(0);
    }
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

run();
