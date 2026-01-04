import mysql from "mysql";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "signup",
  multipleStatements: true,
});

console.log("Running migration: Add employee and project columns to approval_history...\n");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }

  console.log("Connected to database\n");

  // Read migration file
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, "../database/add_employee_project_to_approval_history.sql"),
    "utf8"
  );

  // Execute the migration SQL
  connection.query(migrationSQL, async (err, results) => {
    if (err) {
      // Handle expected errors gracefully
      if (
        err.code === "ER_DUP_FIELDNAME" ||
        err.code === "ER_DUP_KEYNAME" ||
        err.message.includes("already exists") ||
        err.message.includes("Duplicate")
      ) {
        console.log(`⚠️  ${err.code}: Column/index may already exist (this is okay)`);
      } else {
        console.error("❌ Error executing migration:", err);
        connection.end();
        process.exit(1);
      }
    }

    // Create indexes (they might fail if they exist, which is okay)
    console.log("\nCreating indexes...");
    
    connection.query(
      "CREATE INDEX idx_approval_history_employee_id ON approval_history(employee_id)",
      (err) => {
        if (err && err.code !== "ER_DUP_KEYNAME") {
          console.error("❌ Error creating employee_id index:", err.message);
        } else if (err && err.code === "ER_DUP_KEYNAME") {
          console.log("⚠️  Index idx_approval_history_employee_id already exists");
        } else {
          console.log("✓ Index idx_approval_history_employee_id created");
        }

        connection.query(
          "CREATE INDEX idx_approval_history_project_name ON approval_history(project_name)",
          (err) => {
            if (err && err.code !== "ER_DUP_KEYNAME") {
              console.error("❌ Error creating project_name index:", err.message);
            } else if (err && err.code === "ER_DUP_KEYNAME") {
              console.log("⚠️  Index idx_approval_history_project_name already exists");
            } else {
              console.log("✓ Index idx_approval_history_project_name created");
            }

            // Verify columns were added
            console.log("\nVerifying columns...");
            connection.query(
              `SELECT COLUMN_NAME 
               FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'approval_history' 
               AND COLUMN_NAME IN ('employee_id', 'employee_name', 'project_name')`,
              (err, columns) => {
                if (err) {
                  console.error("❌ Error verifying columns:", err);
                } else {
                  if (columns.length === 3) {
                    console.log("✅ All columns verified successfully!");
                    console.log("   - employee_id");
                    console.log("   - employee_name");
                    console.log("   - project_name");
                  } else {
                    console.log(`⚠️  Found ${columns.length}/3 columns. Columns found:`, 
                      columns.map(c => c.COLUMN_NAME).join(", "));
                  }
                }

                console.log("\n✅ Migration completed!");
                connection.end();
                process.exit(0);
              }
            );
          }
        );
      }
    );
  });
});
