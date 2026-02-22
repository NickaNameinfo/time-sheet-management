import { query } from "../config/database.js";

/**
 * Mark challenge_days as 'missed' where date < today and status is still 'pending'.
 * Run daily (e.g. at 00:05 or after midnight).
 */
export async function runChallengeEodJob() {
  const today = new Date().toISOString().slice(0, 10);
  const result = await query(
    `UPDATE challenge_days SET status = 'missed' WHERE status = 'pending' AND date < ?`,
    [today]
  );
  if (result.affectedRows > 0) {
    console.log(`[Challenge EOD] Marked ${result.affectedRows} day(s) as missed.`);
  }
  return result;
}
