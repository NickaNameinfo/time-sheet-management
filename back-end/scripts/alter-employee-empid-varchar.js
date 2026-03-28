import mysql from "mysql";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const employeeSql = fs.readFileSync(
  path.join(__dirname, "../database/alter_employee_empid_varchar.sql"),
  "utf8"
);
const teamLeadSqlPath = path.join(__dirname, "../database/alter_team_lead_empid_varchar.sql");
const teamLeadSql = fs.existsSync(teamLeadSqlPath)
  ? fs.readFileSync(teamLeadSqlPath, "utf8")
  : "";

function runOnPool(config, label) {
  return new Promise((resolve, reject) => {
    const conn = mysql.createConnection({ ...config, multipleStatements: true });
    conn.connect((err) => {
      if (err) return reject(err);
      console.log(`Connected (${label})`);
      conn.query(employeeSql, (qErr) => {
        if (qErr) {
          conn.end();
          return reject(qErr);
        }
        console.log(`  ✅ employee.EMPID → VARCHAR (${label})`);
        if (!teamLeadSql.trim()) {
          conn.end();
          return resolve();
        }
        conn.query(teamLeadSql, (q2Err) => {
          conn.end();
          if (q2Err) {
            if (q2Err.code === "ER_NO_SUCH_TABLE") {
              console.log(`  ⚠️  team_lead skipped (no table) (${label})`);
              return resolve();
            }
            return reject(q2Err);
          }
          console.log(`  ✅ team_lead.EMPID → VARCHAR (${label})`);
          resolve();
        });
      });
    });
  });
}

async function main() {
  try {
    await runOnPool(
      {
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "signup",
      },
      "primary DB"
    );
    if (process.env.COMPANY_DB_NAME || process.env.COMPANY_DB_HOST) {
      await runOnPool(
        {
          host: process.env.COMPANY_DB_HOST || process.env.DB_HOST || "localhost",
          user: process.env.COMPANY_DB_USER || process.env.DB_USER || "root",
          password: process.env.COMPANY_DB_PASSWORD || process.env.DB_PASSWORD || "",
          database: process.env.COMPANY_DB_NAME || process.env.DB_NAME || "signup",
        },
        "company DB"
      );
    }
    process.exit(0);
  } catch (e) {
    console.error("Error:", e.message || e);
    process.exit(1);
  }
}

main();
