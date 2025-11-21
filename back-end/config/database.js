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
});

// Create connection pool for biometric database
const biometricPool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME_BIOMETRIC || "epushserver",
  connectionLimit: 10,
  queueLimit: 0,
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
    // Only log as warning, don't fail - biometric database is optional
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

// Promisify biometric query function
// Gracefully handles missing biometric database
export const biometricQuery = (sql, params) => {
  return new Promise((resolve, reject) => {
    biometricPool.query(sql, params, (err, results) => {
      if (err) {
        // If database doesn't exist, return empty array instead of error
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

export default { pool, biometricPool, query, biometricQuery, con, con1 };

