import { query } from "../config/database.js";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Mark KYC as VERIFIED if submitted_at was more than 24 hours ago.
 * Run every hour (or every 15 min) so we catch submissions after 24h.
 */
export async function runKycVerificationJob() {
  const rows = await query(
    `SELECT id, user_id, submitted_at FROM investment_kyc
     WHERE status = 'PENDING_VERIFICATION' AND submitted_at IS NOT NULL`
  );
  const now = Date.now();
  let verified = 0;
  for (const row of Array.isArray(rows) ? rows : []) {
    const submitted = new Date(row.submitted_at).getTime();
    if (now - submitted >= TWENTY_FOUR_HOURS_MS) {
      await query(
        "UPDATE investment_kyc SET status = 'VERIFIED', verified_at = CURRENT_TIMESTAMP WHERE id = ?",
        [row.id]
      );
      await query(
        "INSERT INTO investment_audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, 'KYC_VERIFIED', 'kyc', ?, ?)",
        [row.user_id, row.id, JSON.stringify({ message: "Auto verified after 24h" })]
      );
      await query(
        "INSERT INTO investment_notifications (user_id, title, message) VALUES (?, ?, ?)",
        [row.user_id, "Profile Verified", "Your profile is verified. You can now start investing."]
      );
      verified++;
    }
  }
  if (verified > 0) console.log(`[Investment KYC] Verified ${verified} KYC record(s).`);
  return { verified };
}

/**
 * Mark investments as MATURED where maturity_date <= today and status = ACTIVE.
 * Run daily.
 */
export async function runMaturityCheckJob() {
  const today = new Date().toISOString().slice(0, 10);
  const result = await query(
    "UPDATE investments SET status = 'MATURED', updated_at = CURRENT_TIMESTAMP WHERE status = 'ACTIVE' AND maturity_date <= ?",
    [today]
  );
  if (result.affectedRows > 0) {
    console.log(`[Investment Maturity] Marked ${result.affectedRows} investment(s) as matured.`);
  }
  return result;
}
