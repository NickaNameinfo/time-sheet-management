import { query } from "../config/database.js";

async function run() {
  try {
    const tables = await query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trail_version_config'"
    );
    if (tables && tables.length > 0) {
      console.log("✓ trail_version_config table already exists.");
      process.exit(0);
      return;
    }

    await query(`
      CREATE TABLE trail_version_config (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type ENUM('company','email') NOT NULL,
        company_id INT NULL DEFAULT NULL,
        company_name VARCHAR(255) NULL DEFAULT NULL,
        email VARCHAR(255) NULL DEFAULT NULL,
        days INT NOT NULL DEFAULT 30,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_type (type),
        KEY idx_company_id (company_id),
        KEY idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    console.log("✓ trail_version_config table created.");

    // Migrate from app_settings if present
    let rows = [];
    try {
      rows = await query(
        "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('admin_trail_version_companies', 'admin_trail_version_list', 'admin_trail_version_emails')"
      );
    } catch (e) {
      if (e.code === "ER_NO_SUCH_TABLE") console.log("(app_settings not found; skipping migration)");
      else throw e;
    }
    const map = {};
    (rows || []).forEach((r) => { map[r.setting_key] = r.setting_value; });

    const companiesRaw = map.admin_trail_version_companies;
    const listRaw = map.admin_trail_version_list;
    const emailsRaw = map.admin_trail_version_emails;

    if (companiesRaw) {
      try {
        const list = typeof companiesRaw === "string" ? JSON.parse(companiesRaw || "[]") : companiesRaw;
        if (Array.isArray(list)) {
          for (const e of list) {
            const company_id = parseInt(e?.company_id ?? e?.id, 10);
            const company_name = (e?.company_name ?? "").toString().trim();
            const days = Math.max(1, Math.min(365, parseInt(e?.days ?? 30, 10) || 30));
            if (company_id && company_name) {
              await query(
                "INSERT INTO trail_version_config (type, company_id, company_name, days) VALUES ('company', ?, ?, ?)",
                [company_id, company_name, days]
              );
            }
          }
          console.log("✓ Migrated company entries from app_settings.");
        }
      } catch (_) {}
    }

    if (listRaw) {
      try {
        const list = typeof listRaw === "string" ? JSON.parse(listRaw || "[]") : listRaw;
        if (Array.isArray(list)) {
          for (const e of list) {
            const email = (e?.email ?? e).toString().trim().toLowerCase();
            const days = Math.max(1, Math.min(365, parseInt(e?.days ?? 30, 10) || 30));
            if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              await query(
                "INSERT INTO trail_version_config (type, email, days) VALUES ('email', ?, ?)",
                [email, days]
              );
            }
          }
          console.log("✓ Migrated email entries from app_settings.");
        }
      } catch (_) {}
    }

    if (emailsRaw && !listRaw) {
      try {
        const list = typeof emailsRaw === "string" ? JSON.parse(emailsRaw || "[]") : emailsRaw;
        const arr = Array.isArray(list) ? list : String(emailsRaw).split(/[\n,]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);
        const defaultDays = 30;
        for (const email of arr) {
          if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            await query(
              "INSERT INTO trail_version_config (type, email, days) VALUES ('email', ?, ?)",
              [email, defaultDays]
            );
          }
        }
        if (arr.length) console.log("✓ Migrated legacy email allowlist from app_settings.");
      } catch (_) {}
    }
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
  process.exit(0);
}
run();
