import mysql from "mysql";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env") });

const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "signup",
  multipleStatements: true,
});

const statements = [
  "ALTER TABLE challenge_users ADD COLUMN referred_by_user_id INT NULL COMMENT 'challenge_users.id of referrer' AFTER address",
  "ALTER TABLE challenge_users ADD CONSTRAINT fk_challenge_users_referred_by FOREIGN KEY (referred_by_user_id) REFERENCES challenge_users(id) ON DELETE SET NULL",
  `CREATE TABLE IF NOT EXISTS referral_earnings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrer_user_id INT NOT NULL,
  referred_user_id INT NOT NULL,
  investment_id INT NOT NULL,
  first_investment_amount DECIMAL(15,2) NOT NULL,
  referral_amount DECIMAL(15,2) NOT NULL,
  status ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED') DEFAULT 'PENDING_APPROVAL',
  approved_at TIMESTAMP NULL,
  approved_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_user_id) REFERENCES challenge_users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_user_id) REFERENCES challenge_users(id) ON DELETE CASCADE,
  FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE,
  UNIQUE KEY uk_referral_per_investment (investment_id),
  INDEX idx_referrer_status (referrer_user_id, status),
  INDEX idx_status (status)
)`,
];

function runNext(index) {
  if (index >= statements.length) {
    console.log("✅ Referral migration completed.");
    connection.end();
    return;
  }
  const sql = statements[index];
  connection.query(sql, (err) => {
    if (err) {
      const msg = err.message || "";
      const skip = msg.includes("Duplicate column") || msg.includes("Duplicate key name") || msg.includes("already exists") || msg.includes("ER_DUP_FIELDNAME") || msg.includes("ER_DUP_KEYNAME");
      if (skip) {
        console.log("⏭️  Skipped (already applied):", sql.substring(0, 55) + "...");
        runNext(index + 1);
      } else {
        console.error("Migration error:", msg);
        connection.end();
        process.exit(1);
      }
    } else {
      console.log("✅ Applied:", sql.substring(0, 55).replace(/\n/g, " ") + "...");
      runNext(index + 1);
    }
  });
}

console.log("Running referral migration...");
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err.message);
    process.exit(1);
  }
  runNext(0);
});
