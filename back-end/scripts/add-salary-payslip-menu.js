/**
 * Adds Salary & Payslip menu + enables it for companies with Payroll & Finance access.
 * Run: node scripts/add-salary-payslip-menu.js
 */
import mysql from "mysql";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "signup",
  multipleStatements: true,
});

console.log("Applying Salary & Payslip menu migration...\n");

connection.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }

  const sqlFile = fs.readFileSync(
    path.join(__dirname, "../database/add_salary_payslip.sql"),
    "utf8"
  );

  connection.query(sqlFile, (queryErr) => {
    if (queryErr) {
      console.error("Migration failed:", queryErr.message);
      connection.end();
      process.exit(1);
    }

    connection.query(
      "SELECT company_id, enabled FROM company_menu_permissions WHERE menu_key = 'salary_payslip'",
      (e2, rows) => {
        console.log(`✅ Done. salary_payslip enabled for ${rows?.length || 0} company/companies.`);
        if (rows?.length) console.log(rows);
        connection.end();
        process.exit(0);
      }
    );
  });
});
