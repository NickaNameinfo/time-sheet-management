/**
 * Add discipline_code column to discipline table and seed rules: Marketing-101, Sales-201, etc.
 * Run from back-end: node scripts/add-discipline-code.js
 */
import { query } from "../config/database.js";

const SEED = [
  { discipline: "Marketing", discipline_code: "101" },
  { discipline: "Sales", discipline_code: "201" },
  { discipline: "Website Development", discipline_code: "301" },
  { discipline: "Nickname Products", discipline_code: "401" },
  { discipline: "Sales websites", discipline_code: "501" },
];

async function run() {
  console.log("Adding discipline_code and seeding discipline rules...\n");

  try {
    const cols = await query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'discipline' AND COLUMN_NAME = 'discipline_code'"
    );
    if (!Array.isArray(cols) || cols.length === 0) {
      await query(
        "ALTER TABLE discipline ADD COLUMN discipline_code VARCHAR(50) NULL COMMENT 'Code for project creation' AFTER discipline"
      );
      console.log("  ✓ Column discipline_code added.");
    } else {
      console.log("  ✓ Column discipline_code already exists.");
    }

    const keys = await query(
      "SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'discipline' AND INDEX_NAME = 'unique_discipline_code'"
    );
    if (!Array.isArray(keys) || keys.length === 0) {
      await query("ALTER TABLE discipline ADD UNIQUE KEY unique_discipline_code (discipline_code)");
      console.log("  ✓ Unique key on discipline_code added.");
    } else {
      console.log("  ✓ Unique key unique_discipline_code already exists.");
    }

    for (const row of SEED) {
      await query(
        "INSERT INTO discipline (discipline, discipline_code) VALUES (?, ?) ON DUPLICATE KEY UPDATE discipline = VALUES(discipline)",
        [row.discipline, row.discipline_code]
      );
      console.log(`  ✓ ${row.discipline} - ${row.discipline_code}`);
    }

    const list = await query("SELECT id, discipline, discipline_code FROM discipline ORDER BY discipline_code");
    const rows = Array.isArray(list) ? list : [];
    console.log("\nDiscipline rules in DB:", rows.length);
    rows.forEach((r) => console.log(`  ${r.discipline} - ${r.discipline_code || "(no code)"}`));
    console.log("\n✅ Done.");
    process.exit(0);
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      console.error("discipline table does not exist. Create it first.");
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

run();
