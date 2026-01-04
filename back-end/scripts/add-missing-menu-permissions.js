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

console.log("Adding missing menu permissions...\n");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }

  console.log("Connected to database\n");

  // Read SQL file
  const sqlFile = fs.readFileSync(
    path.join(__dirname, "../database/add_missing_menu_permissions.sql"),
    "utf8"
  );

  // Execute SQL
  connection.query(sqlFile, (err, results) => {
    if (err) {
      // Check if it's a duplicate entry error (menu already exists)
      if (err.code === "ER_DUP_ENTRY" || err.message.includes("Duplicate entry")) {
        console.log("⚠ Some menu items already exist. This is normal if running the script multiple times.");
        console.log("✅ Migration completed (duplicate entries ignored)");
      } else {
        console.error("Error adding missing menu permissions:", err);
        connection.end();
        process.exit(1);
      }
    } else {
      console.log("✅ Missing menu permissions added successfully!");
      console.log("\nAdded menu items:");
      console.log("  - Project Planning");
      console.log("  - Manage Team Leads");
      console.log("  - Manage HR");
      console.log("  - Reports (Parent Menu)");
      console.log("  - Settings (Parent Menu)");
      console.log("  - Approvals (Parent Menu)");
      console.log("  - Settings - Overtime Rules");
      console.log("  - Settings - App Settings");
    }

    console.log("\nPlease verify the menu items in Menu Permissions settings page.");
    connection.end();
    process.exit(0);
  });
});

