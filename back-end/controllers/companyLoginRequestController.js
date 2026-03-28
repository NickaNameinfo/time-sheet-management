import bcrypt from "bcrypt";
import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

async function ensureCompanyLoginRequestsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS company_login_requests (
      id INT NOT NULL AUTO_INCREMENT,
      company_id INT NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('company_admin','company_user') NOT NULL DEFAULT 'company_user',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      requested_by_company_user_id INT NULL,
      reviewed_at DATETIME NULL,
      reviewed_by_email VARCHAR(255) NULL,
      reject_reason VARCHAR(500) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_clr_company (company_id),
      KEY idx_clr_status (status),
      KEY idx_clr_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

function normalizeEmail(email) {
  return (email || "").toString().trim().toLowerCase();
}

/** Company admin: submit a new profile login for Super Admin approval */
export const createCompanyLoginRequest = asyncHandler(async (req, res) => {
  await ensureCompanyLoginRequestsTable();

  if (!req.isCompanyUser || req.company_id == null) {
    return sendError(res, "Company login required", 403);
  }
  if (req.company_role === "company_user") {
    return sendError(res, "Only company admin can request new company logins", 403);
  }

  const companyId = Number(req.company_id);
  const { email, password, role, is_active } = req.body;
  const em = normalizeEmail(email);
  if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
    return sendError(res, "Valid email is required", 400);
  }
  if (!password || String(password).length < 6) {
    return sendError(res, "Password is required (min 6 characters)", 400);
  }
  const r = role === "company_admin" ? "company_admin" : "company_user";
  const active = is_active === false || is_active === 0 || is_active === "0" ? 0 : 1;

  const dup = await query(
    "SELECT id FROM company_users WHERE company_id = ? AND LOWER(TRIM(email)) = ? LIMIT 1",
    [companyId, em]
  );
  if (dup.length > 0) {
    return sendError(res, "This email already has a company login", 409);
  }

  const pending = await query(
    "SELECT id FROM company_login_requests WHERE company_id = ? AND LOWER(TRIM(email)) = ? AND status = 'pending' LIMIT 1",
    [companyId, em]
  );
  if (pending.length > 0) {
    return sendError(res, "A pending request already exists for this email", 409);
  }

  const password_hash = await bcrypt.hash(String(password), 10);
  const reqBy = req.company_user_id ? Number(req.company_user_id) : null;

  const ins = await query(
    `INSERT INTO company_login_requests
      (company_id, email, password_hash, role, is_active, status, requested_by_company_user_id)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [companyId, em, password_hash, r, active, reqBy]
  );

  return sendSuccess(res, { id: ins.insertId }, "Request submitted. Super Admin will review it.");
});

/** Company: list own pending/recent requests */
export const listMyCompanyLoginRequests = asyncHandler(async (req, res) => {
  await ensureCompanyLoginRequestsTable();
  if (!req.isCompanyUser || req.company_id == null) {
    return sendError(res, "Company login required", 403);
  }
  const companyId = Number(req.company_id);
  const rows = await query(
    `SELECT id, email, role, is_active, status, created_at, reviewed_at, reject_reason
     FROM company_login_requests WHERE company_id = ? ORDER BY created_at DESC LIMIT 50`,
    [companyId]
  );
  return sendSuccess(res, rows);
});

/** Super Admin: list all requests */
export const listCompanyLoginRequestsAdmin = asyncHandler(async (req, res) => {
  await ensureCompanyLoginRequestsTable();
  const status = (req.query.status || "pending").toString().toLowerCase();
  const allowed = ["pending", "approved", "rejected", "all"];
  const st = allowed.includes(status) ? status : "pending";

  let sql = `
    SELECT r.id, r.company_id, r.email, r.role, r.is_active, r.status, r.created_at,
           r.reviewed_at, r.reviewed_by_email, r.reject_reason, r.requested_by_company_user_id,
           c.company_name, c.company_code
    FROM company_login_requests r
    INNER JOIN companies c ON c.id = r.company_id
    WHERE 1=1
  `;
  const params = [];
  if (st !== "all") {
    sql += " AND r.status = ?";
    params.push(st);
  }
  sql += " ORDER BY r.created_at DESC";

  const rows = await query(sql, params);
  return sendSuccess(res, rows);
});

/** Super Admin: approve → create company_users row */
export const approveCompanyLoginRequest = asyncHandler(async (req, res) => {
  await ensureCompanyLoginRequestsTable();
  const id = Number(req.params.id);
  const rows = await query(
    "SELECT * FROM company_login_requests WHERE id = ? AND status = 'pending' LIMIT 1",
    [id]
  );
  if (rows.length === 0) {
    return sendError(res, "Request not found or already processed", 404);
  }
  const r = rows[0];
  const em = normalizeEmail(r.email);

  const exists = await query(
    "SELECT id FROM company_users WHERE company_id = ? AND LOWER(TRIM(email)) = ? LIMIT 1",
    [r.company_id, em]
  );
  if (exists.length > 0) {
    await query(
      "UPDATE company_login_requests SET status = 'rejected', reviewed_at = NOW(), reviewed_by_email = ?, reject_reason = ? WHERE id = ?",
      [req.userName || "admin", "Email already exists as company login", id]
    );
    return sendError(res, "Email already registered as company login; request rejected", 409);
  }

  await query(
    "INSERT INTO company_users (company_id, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)",
    [r.company_id, em, r.password_hash, r.role, r.is_active ? 1 : 0]
  );

  await query(
    `UPDATE company_login_requests SET status = 'approved', reviewed_at = NOW(), reviewed_by_email = ? WHERE id = ?`,
    [req.userName || "admin", id]
  );

  return sendSuccess(res, null, "Login approved and created");
});

/** Super Admin: reject */
export const rejectCompanyLoginRequest = asyncHandler(async (req, res) => {
  await ensureCompanyLoginRequestsTable();
  const id = Number(req.params.id);
  const reason = (req.body?.reason || "").toString().trim().slice(0, 500);

  const rows = await query(
    "SELECT id FROM company_login_requests WHERE id = ? AND status = 'pending' LIMIT 1",
    [id]
  );
  if (rows.length === 0) {
    return sendError(res, "Request not found or already processed", 404);
  }

  await query(
    `UPDATE company_login_requests SET status = 'rejected', reviewed_at = NOW(),
     reviewed_by_email = ?, reject_reason = ? WHERE id = ?`,
    [req.userName || "admin", reason || null, id]
  );

  return sendSuccess(res, null, "Request rejected");
});
