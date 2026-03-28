/**
 * Apply full menu restructure (Dashboard, Employee Management, Project Management, etc.).
 * Reads SQL from database/restructure_menus_full.sql and runs each INSERT.
 * Run from back-end: node scripts/restructure-menus-full.js
 */
import { query } from "../config/database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const sqlPath = path.join(__dirname, "../database/restructure_menus_full.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  // Split by semicolon; strip leading comment lines so we don't skip INSERT/UPDATE
  const rawChunks = sql.split(";").map((s) => s.trim()).filter((s) => s.length > 0);
  const statements = [];
  for (const chunk of rawChunks) {
    // Remove leading lines that are only comments or blank
    const withoutLeadingComments = chunk.replace(/^(\s*--[^\n]*\n?|\s)+/, "").trim();
    if (withoutLeadingComments.startsWith("INSERT INTO") || withoutLeadingComments.startsWith("UPDATE ")) {
      statements.push(withoutLeadingComments);
    }
  }

  console.log("Applying menu restructure (" + statements.length + " statements)...\n");

  try {
    for (const stmt of statements) {
      await query(stmt + ";");
    }
    console.log("✅ Menu restructure applied successfully.");
    process.exit(0);
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      console.error("menu_permissions table does not exist. Create it first.");
    }
    console.error(err);
    process.exit(1);
  }
}

run();
