import { query } from "../config/database.js";

const createTableSql = `
CREATE TABLE IF NOT EXISTS sales_leads (
  id INT NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  work_email VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  company_size VARCHAR(50) NULL,
  phone_number VARCHAR(50) NULL,
  created_by INT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sales_leads_created_by (created_by),
  KEY idx_sales_leads_created_at (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

async function run() {
  try {
    await query(createTableSql);
    console.log("✅ sales_leads table created or already exists.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to create sales_leads table:", err.message);
    process.exit(1);
  }
}

run();
