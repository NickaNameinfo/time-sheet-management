import mysql from "mysql";
import dotenv from "dotenv";

dotenv.config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "signup",
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z", // Interpret TIMESTAMP/datetime as UTC for consistent dates
});

// Create connection pool for biometric database (uses super admin DB host/user)
const biometricPool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME_BIOMETRIC || "epushserver",
  connectionLimit: 10,
  queueLimit: 0,
});

// Company database (tenant DB) – used for all operations after company user login
const companyPool = mysql.createPool({
  host: process.env.COMPANY_DB_HOST || process.env.DB_HOST || "localhost",
  user: process.env.COMPANY_DB_USER || process.env.DB_USER || "root",
  password: process.env.COMPANY_DB_PASSWORD || process.env.DB_PASSWORD || "",
  database: process.env.COMPANY_DB_NAME || process.env.DB_NAME || "signup",
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z",
});

// Test primary database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to primary database:", err);
  } else {
    console.log("Connected to primary database");
    connection.release();
  }
});

// Test biometric database connection (optional - don't fail if database doesn't exist)
biometricPool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.warn("Biometric database not found. Biometric features will be disabled.");
    } else {
      console.warn("Error connecting to biometric database:", err.message);
    }
  } else {
    console.log("Connected to biometric database");
    connection.release();
  }
});

// Test company database connection
companyPool.getConnection((err, connection) => {
  if (err) {
    console.warn("Error connecting to company database:", err.message);
  } else {
    console.log("Connected to company database");
    connection.release();
  }
});

// Promisify query function for async/await support
export const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Promisify company (tenant) query – use for all data operations when company user is logged in
export const companyQuery = (sql, params) => {
  return new Promise((resolve, reject) => {
    companyPool.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

/** Returns query function: company DB when req.isCompanyUser, req.company_id, or req.company_user_id is set (company login), otherwise super admin DB. Use for tenant data (employee, project, leave, etc.). */
export const getTenantQuery = (req) => {
  const useCompanyDb =
    req &&
    (req.isCompanyUser === true ||
      (req.company_id != null && req.company_id !== "") ||
      (req.company_user_id != null && req.company_user_id !== ""));
  return useCompanyDb ? companyQuery : query;
};

// Promisify biometric query function
// Gracefully handles missing biometric database
export const biometricQuery = (sql, params) => {
  return new Promise((resolve, reject) => {
    biometricPool.query(sql, params, (err, results) => {
      if (err) {
        if (err.code === 'ER_BAD_DB_ERROR' || err.code === 'ECONNREFUSED') {
          console.warn("Biometric database not available, returning empty results");
          resolve([]);
        } else {
          reject(err);
        }
      } else {
        resolve(results);
      }
    });
  });
};

// Legacy connection for backward compatibility (will be deprecated)
export const con = {
  query: (sql, params, callback) => {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }
    pool.query(sql, params, callback);
  },
};

export const con1 = {
  query: (sql, params, callback) => {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }
    biometricPool.query(sql, params, callback);
  },
};

export default { pool, biometricPool, companyPool, query, companyQuery, getTenantQuery, biometricQuery, con, con1 };

