import bcrypt from "bcrypt";
import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { resolveCompanyMenuEnabled } from "../utils/companyMenuPermissions.js";

let tablesEnsured = false;

async function ensureSuperAdminTables() {
  if (tablesEnsured) return;
  // Create tables one-by-one (pool doesn't use multipleStatements by default)
  await query(`
    CREATE TABLE IF NOT EXISTS companies (
      id INT NOT NULL AUTO_INCREMENT,
      company_code VARCHAR(50) NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_company_code (company_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS company_users (
      id INT NOT NULL AUTO_INCREMENT,
      company_id INT NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('company_admin','company_user') NOT NULL DEFAULT 'company_user',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      last_login_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_company_user_email (email),
      KEY idx_company_users_company (company_id),
      CONSTRAINT fk_company_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  try {
    await query(
      "ALTER TABLE company_users ADD COLUMN menu_role_name VARCHAR(100) NULL DEFAULT NULL COMMENT 'Sidebar menus: must match Settings-Roles role_name (e.g. Video Editor)' AFTER role"
    );
  } catch (e) {
    if (e.code !== "ER_DUP_FIELDNAME" && e.errno !== 1060) throw e;
  }

  await query(`
    CREATE TABLE IF NOT EXISTS company_subscriptions (
      id INT NOT NULL AUTO_INCREMENT,
      company_id INT NOT NULL,
      plan_name VARCHAR(100) NOT NULL,
      status ENUM('active','paused','cancelled','expired') NOT NULL DEFAULT 'active',
      start_date DATE NOT NULL,
      end_date DATE NULL,
      amount DECIMAL(12,2) NULL,
      currency VARCHAR(10) NULL,
      notes VARCHAR(500) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_sub_company (company_id),
      KEY idx_sub_status (status),
      CONSTRAINT fk_sub_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS company_billing (
      id INT NOT NULL AUTO_INCREMENT,
      company_id INT NOT NULL,
      invoice_no VARCHAR(50) NOT NULL,
      period_start DATE NULL,
      period_end DATE NULL,
      due_date DATE NULL,
      amount_due DECIMAL(12,2) NOT NULL DEFAULT 0,
      amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
      status ENUM('draft','sent','paid','overdue','void') NOT NULL DEFAULT 'draft',
      paid_at DATETIME NULL,
      notes VARCHAR(500) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_invoice_no (invoice_no),
      KEY idx_bill_company (company_id),
      KEY idx_bill_status (status),
      CONSTRAINT fk_bill_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS company_menu_permissions (
      id INT NOT NULL AUTO_INCREMENT,
      company_id INT NOT NULL,
      menu_key VARCHAR(100) NOT NULL,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_company_menu (company_id, menu_key),
      KEY idx_cmp_company (company_id),
      CONSTRAINT fk_cmp_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS company_menu_trial_settings (
      id INT NOT NULL AUTO_INCREMENT,
      company_id INT NOT NULL,
      menu_key VARCHAR(100) NOT NULL,
      trial_enabled TINYINT(1) NOT NULL DEFAULT 0,
      trial_days INT NOT NULL DEFAULT 30,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_company_menu_trial (company_id, menu_key),
      KEY idx_cmts_company (company_id),
      CONSTRAINT fk_cmts_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  tablesEnsured = true;
}

function normalizeEmail(email) {
  return (email || "").toString().trim().toLowerCase();
}

function toBool(v) {
  return v === true || v === 1 || v === "1" || v === "true";
}

// Companies
export const listCompanies = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const q = (req.query.q || "").toString().trim().toLowerCase();
  let sql = "SELECT * FROM companies";
  const params = [];
  if (q) {
    sql += " WHERE LOWER(company_name) LIKE ? OR LOWER(company_code) LIKE ?";
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += " ORDER BY created_at DESC";
  const rows = await query(sql, params);
  return sendSuccess(res, rows);
});

export const createCompany = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const company_code = (req.body.company_code || "").toString().trim();
  const company_name = (req.body.company_name || "").toString().trim();
  const status = req.body.status === "inactive" ? "inactive" : "active";
  if (!company_code || !company_name) return sendError(res, "company_code and company_name are required", 400);

  const result = await query(
    "INSERT INTO companies (company_code, company_name, status) VALUES (?, ?, ?)",
    [company_code, company_name, status]
  );
  return sendSuccess(res, { id: result.insertId }, "Company created");
});

export const updateCompany = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const id = req.params.id;
  const company_code = (req.body.company_code || "").toString().trim();
  const company_name = (req.body.company_name || "").toString().trim();
  const status = req.body.status === "inactive" ? "inactive" : "active";
  if (!company_code || !company_name) return sendError(res, "company_code and company_name are required", 400);
  const r = await query(
    "UPDATE companies SET company_code = ?, company_name = ?, status = ? WHERE id = ?",
    [company_code, company_name, status, id]
  );
  if (r.affectedRows === 0) return sendError(res, "Company not found", 404);
  return sendSuccess(res, null, "Company updated");
});

export const deleteCompany = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const id = req.params.id;
  const r = await query("DELETE FROM companies WHERE id = ?", [id]);
  if (r.affectedRows === 0) return sendError(res, "Company not found", 404);
  return sendSuccess(res, null, "Company deleted");
});

// Lead companies (to quickly create company from Lead List)
export const listLeadCompanies = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").toString().trim().toLowerCase();
  // Pick latest lead row per company_name to surface "details"
  let sql = `
    SELECT x.company_name, x.company_size, x.phone_number, x.work_email, x.full_name, x.createdAt
    FROM (
      SELECT
        l.company_name,
        l.company_size,
        l.phone_number,
        l.work_email,
        l.full_name,
        l.createdAt,
        ROW_NUMBER() OVER (PARTITION BY l.company_name ORDER BY l.createdAt DESC, l.id DESC) AS rn
      FROM sales_leads l
      WHERE l.company_name IS NOT NULL AND TRIM(l.company_name) <> ''
    ) x
    WHERE x.rn = 1
  `;
  const params = [];
  if (q) {
    sql += " AND LOWER(x.company_name) LIKE ?";
    params.push(`%${q}%`);
  }
  sql += " ORDER BY x.createdAt DESC LIMIT 200";

  try {
    const rows = await query(sql, params);
    return sendSuccess(res, rows || []);
  } catch (err) {
    // If DB does not support window functions (older MySQL), fall back to a simpler distinct list
    if (err && (String(err.message || "").includes("ROW_NUMBER") || err.code === "ER_PARSE_ERROR")) {
      let sql2 = `
        SELECT company_name, MAX(createdAt) as createdAt
        FROM sales_leads
        WHERE company_name IS NOT NULL AND TRIM(company_name) <> ''
      `;
      const p2 = [];
      if (q) {
        sql2 += " AND LOWER(company_name) LIKE ?";
        p2.push(`%${q}%`);
      }
      sql2 += " GROUP BY company_name ORDER BY createdAt DESC LIMIT 200";
      const rows2 = await query(sql2, p2);
      return sendSuccess(
        res,
        (rows2 || []).map((r) => ({
          company_name: r.company_name,
          company_size: null,
          phone_number: null,
          work_email: null,
          full_name: null,
          createdAt: r.createdAt,
        }))
      );
    }
    throw err;
  }
});

// Company Users (profile login list)
export const listCompanyUsers = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  // If JWT belongs to a company admin/user, only return their own company's logins.
  // This prevents "show all companies" leaks when frontend doesn't pass company_id.
  const tokenCompanyId =
    req.company_id !== undefined && req.company_id !== null && req.company_id !== ""
      ? Number(req.company_id)
      : null;
  const companyId =
    tokenCompanyId ||
    (req.query.company_id ? Number(req.query.company_id) : null);
  const q = normalizeEmail(req.query.q || "");

  let sql = `
    SELECT cu.id, cu.company_id, c.company_name, c.company_code,
           cu.email, cu.role, cu.menu_role_name, cu.is_active, cu.last_login_at, cu.created_at, cu.updated_at,
           CASE
             WHEN cu.created_at = (
               SELECT MIN(cu2.created_at)
               FROM company_users cu2
               WHERE cu2.company_id = cu.company_id
             ) THEN 'super_admin_created'
             ELSE 'company_created'
           END AS created_tag
    FROM company_users cu
    INNER JOIN companies c ON c.id = cu.company_id
    WHERE 1=1
  `;
  const params = [];
  if (companyId) {
    sql += " AND cu.company_id = ?";
    params.push(companyId);
  }
  if (q) {
    sql += " AND LOWER(cu.email) LIKE ?";
    params.push(`%${q}%`);
  }
  sql += " ORDER BY cu.created_at DESC";

  const rows = await query(sql, params);
  return sendSuccess(res, rows);
});

export const createCompanyUser = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const company_id = Number(req.body.company_id);
  const email = normalizeEmail(req.body.email);
  const password = (req.body.password || "").toString();
  const role = req.body.role === "company_admin" ? "company_admin" : "company_user";
  const is_active = req.body.is_active === undefined ? 1 : toBool(req.body.is_active) ? 1 : 0;
  const menu_role_name = (req.body.menu_role_name || "").toString().trim().slice(0, 100) || null;

  if (!company_id || !email || !password) return sendError(res, "company_id, email, password are required", 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendError(res, "Invalid email", 400);

  const companyRows = await query("SELECT id FROM companies WHERE id = ?", [company_id]);
  if (companyRows.length === 0) return sendError(res, "Company not found", 404);

  const hashed = await bcrypt.hash(password, 10);
  const r = await query(
    "INSERT INTO company_users (company_id, email, password, role, menu_role_name, is_active) VALUES (?, ?, ?, ?, ?, ?)",
    [company_id, email, hashed, role, menu_role_name, is_active]
  );
  return sendSuccess(res, { id: r.insertId }, "Company user created");
});

export const updateCompanyUser = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const id = req.params.id;
  const email = req.body.email ? normalizeEmail(req.body.email) : null;
  const role = req.body.role === "company_admin" ? "company_admin" : "company_user";
  const is_active = req.body.is_active === undefined ? undefined : toBool(req.body.is_active) ? 1 : 0;
  const password = req.body.password ? String(req.body.password) : null;

  const fields = [];
  const params = [];
  fields.push("role = ?");
  params.push(role);

  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendError(res, "Invalid email", 400);
    fields.push("email = ?");
    params.push(email);
  }

  if (is_active !== undefined) {
    fields.push("is_active = ?");
    params.push(is_active);
  }
  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    fields.push("password = ?");
    params.push(hashed);
  }
  if (req.body.menu_role_name !== undefined) {
    const v = (req.body.menu_role_name || "").toString().trim().slice(0, 100) || null;
    fields.push("menu_role_name = ?");
    params.push(v);
  }
  params.push(id);

  const r = await query(`UPDATE company_users SET ${fields.join(", ")} WHERE id = ?`, params);
  if (r.affectedRows === 0) return sendError(res, "Company user not found", 404);
  return sendSuccess(res, null, "Company user updated");
});

export const deleteCompanyUser = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const id = req.params.id;
  const r = await query("DELETE FROM company_users WHERE id = ?", [id]);
  if (r.affectedRows === 0) return sendError(res, "Company user not found", 404);
  return sendSuccess(res, null, "Company user deleted");
});

// Subscriptions
export const listSubscriptions = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const companyId = req.query.company_id ? Number(req.query.company_id) : null;
  let sql = `
    SELECT cs.*, c.company_name, c.company_code
    FROM company_subscriptions cs
    INNER JOIN companies c ON c.id = cs.company_id
    WHERE 1=1
  `;
  const params = [];
  if (companyId) {
    sql += " AND cs.company_id = ?";
    params.push(companyId);
  }
  sql += " ORDER BY cs.created_at DESC";
  const rows = await query(sql, params);
  return sendSuccess(res, rows);
});

export const createSubscription = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const company_id = Number(req.body.company_id);
  const plan_name = (req.body.plan_name || "").toString().trim();
  const status = ["active", "paused", "cancelled", "expired"].includes(req.body.status) ? req.body.status : "active";
  const start_date = (req.body.start_date || "").toString().trim();
  const end_date = req.body.end_date ? String(req.body.end_date).trim() : null;
  const amount = req.body.amount != null && req.body.amount !== "" ? Number(req.body.amount) : null;
  const currency = req.body.currency ? String(req.body.currency).trim() : null;
  const notes = req.body.notes ? String(req.body.notes).trim().slice(0, 500) : null;

  if (!company_id || !plan_name || !start_date) return sendError(res, "company_id, plan_name, start_date are required", 400);
  const r = await query(
    `INSERT INTO company_subscriptions (company_id, plan_name, status, start_date, end_date, amount, currency, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [company_id, plan_name, status, start_date, end_date, amount, currency, notes]
  );
  return sendSuccess(res, { id: r.insertId }, "Subscription created");
});

export const updateSubscription = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const id = req.params.id;
  const plan_name = (req.body.plan_name || "").toString().trim();
  const status = ["active", "paused", "cancelled", "expired"].includes(req.body.status) ? req.body.status : "active";
  const start_date = (req.body.start_date || "").toString().trim();
  const end_date = req.body.end_date ? String(req.body.end_date).trim() : null;
  const amount = req.body.amount != null && req.body.amount !== "" ? Number(req.body.amount) : null;
  const currency = req.body.currency ? String(req.body.currency).trim() : null;
  const notes = req.body.notes ? String(req.body.notes).trim().slice(0, 500) : null;

  if (!plan_name || !start_date) return sendError(res, "plan_name and start_date are required", 400);
  const r = await query(
    `UPDATE company_subscriptions
     SET plan_name = ?, status = ?, start_date = ?, end_date = ?, amount = ?, currency = ?, notes = ?
     WHERE id = ?`,
    [plan_name, status, start_date, end_date, amount, currency, notes, id]
  );
  if (r.affectedRows === 0) return sendError(res, "Subscription not found", 404);
  return sendSuccess(res, null, "Subscription updated");
});

export const deleteSubscription = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const id = req.params.id;
  const r = await query("DELETE FROM company_subscriptions WHERE id = ?", [id]);
  if (r.affectedRows === 0) return sendError(res, "Subscription not found", 404);
  return sendSuccess(res, null, "Subscription deleted");
});

// Billing
export const listBilling = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const companyId = req.query.company_id ? Number(req.query.company_id) : null;
  let sql = `
    SELECT cb.*, c.company_name, c.company_code
    FROM company_billing cb
    INNER JOIN companies c ON c.id = cb.company_id
    WHERE 1=1
  `;
  const params = [];
  if (companyId) {
    sql += " AND cb.company_id = ?";
    params.push(companyId);
  }
  sql += " ORDER BY cb.created_at DESC";
  const rows = await query(sql, params);
  return sendSuccess(res, rows);
});

export const createBilling = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const company_id = Number(req.body.company_id);
  const invoice_no = (req.body.invoice_no || "").toString().trim();
  const period_start = req.body.period_start ? String(req.body.period_start).trim() : null;
  const period_end = req.body.period_end ? String(req.body.period_end).trim() : null;
  const due_date = req.body.due_date ? String(req.body.due_date).trim() : null;
  const amount_due = req.body.amount_due != null ? Number(req.body.amount_due) : 0;
  const amount_paid = req.body.amount_paid != null ? Number(req.body.amount_paid) : 0;
  const status = ["draft", "sent", "paid", "overdue", "void"].includes(req.body.status) ? req.body.status : "draft";
  const notes = req.body.notes ? String(req.body.notes).trim().slice(0, 500) : null;
  const paid_at = status === "paid" ? new Date() : null;

  if (!company_id || !invoice_no) return sendError(res, "company_id and invoice_no are required", 400);
  const r = await query(
    `INSERT INTO company_billing
     (company_id, invoice_no, period_start, period_end, due_date, amount_due, amount_paid, status, paid_at, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [company_id, invoice_no, period_start, period_end, due_date, amount_due, amount_paid, status, paid_at, notes]
  );
  return sendSuccess(res, { id: r.insertId }, "Billing record created");
});

export const updateBilling = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const id = req.params.id;
  const invoice_no = (req.body.invoice_no || "").toString().trim();
  const period_start = req.body.period_start ? String(req.body.period_start).trim() : null;
  const period_end = req.body.period_end ? String(req.body.period_end).trim() : null;
  const due_date = req.body.due_date ? String(req.body.due_date).trim() : null;
  const amount_due = req.body.amount_due != null ? Number(req.body.amount_due) : 0;
  const amount_paid = req.body.amount_paid != null ? Number(req.body.amount_paid) : 0;
  const status = ["draft", "sent", "paid", "overdue", "void"].includes(req.body.status) ? req.body.status : "draft";
  const notes = req.body.notes ? String(req.body.notes).trim().slice(0, 500) : null;
  const paid_at = status === "paid" ? new Date() : null;

  if (!invoice_no) return sendError(res, "invoice_no is required", 400);
  const r = await query(
    `UPDATE company_billing
     SET invoice_no = ?, period_start = ?, period_end = ?, due_date = ?, amount_due = ?, amount_paid = ?, status = ?, paid_at = ?, notes = ?
     WHERE id = ?`,
    [invoice_no, period_start, period_end, due_date, amount_due, amount_paid, status, paid_at, notes, id]
  );
  if (r.affectedRows === 0) return sendError(res, "Billing record not found", 404);
  return sendSuccess(res, null, "Billing record updated");
});

export const deleteBilling = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const id = req.params.id;
  const r = await query("DELETE FROM company_billing WHERE id = ?", [id]);
  if (r.affectedRows === 0) return sendError(res, "Billing record not found", 404);
  return sendSuccess(res, null, "Billing record deleted");
});

// Company menu permissions (company-based menu permission)
export const getCompanyMenuPermissions = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const companyId = Number(req.query.company_id);
  if (!companyId) return sendError(res, "company_id is required", 400);

  // List all menu rows (same idea as getCompanyMenuTrialSettings). Do not filter by is_active —
  // otherwise Super Admin sees an empty grid when menus are toggled off globally, and cannot set company toggles.
  const allMenus = await query(
    `SELECT menu_key, menu_title, menu_path, parent_menu, is_active, display_order
     FROM menu_permissions
     ORDER BY display_order ASC, menu_title ASC`
  );
  const overrides = await query(
    "SELECT menu_key, enabled FROM company_menu_permissions WHERE company_id = ?",
    [companyId]
  );
  const data = allMenus.map((m) => ({
    ...m,
    enabled: resolveCompanyMenuEnabled(m.menu_key, overrides),
  }));
  return sendSuccess(res, data);
});

export const setCompanyMenuPermissions = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const companyId = Number(req.body.company_id);
  const permissions = Array.isArray(req.body.permissions) ? req.body.permissions : [];
  if (!companyId) return sendError(res, "company_id is required", 400);

  for (const p of permissions) {
    const menu_key = (p?.menu_key || "").toString().trim();
    if (!menu_key) continue;
    const enabled = toBool(p?.enabled) ? 1 : 0;
    const existing = await query(
      "SELECT id FROM company_menu_permissions WHERE company_id = ? AND menu_key = ?",
      [companyId, menu_key]
    );
    if (existing.length > 0) {
      await query(
        "UPDATE company_menu_permissions SET enabled = ? WHERE company_id = ? AND menu_key = ?",
        [enabled, companyId, menu_key]
      );
    } else {
      await query(
        "INSERT INTO company_menu_permissions (company_id, menu_key, enabled) VALUES (?, ?, ?)",
        [companyId, menu_key, enabled]
      );
    }
  }

  return sendSuccess(res, null, "Company menu permissions saved");
});

// Menu-based trial settings (company + menu_key)
export const getCompanyMenuTrialSettings = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const companyId = Number(req.query.company_id);
  if (!companyId) return sendError(res, "company_id is required", 400);

  const allMenus = await query(
    "SELECT menu_key, menu_title, menu_path, parent_menu, is_active, display_order FROM menu_permissions ORDER BY display_order ASC, menu_title ASC"
  );
  const rows = await query(
    "SELECT menu_key, trial_enabled, trial_days FROM company_menu_trial_settings WHERE company_id = ?",
    [companyId]
  );
  const map = new Map(rows.map((r) => [r.menu_key, { trial_enabled: toBool(r.trial_enabled), trial_days: Number(r.trial_days) }]));
  const data = allMenus.map((m) => ({
    ...m,
    trial_enabled: map.get(m.menu_key)?.trial_enabled ?? false,
    trial_days: map.get(m.menu_key)?.trial_days ?? 30,
  }));
  return sendSuccess(res, data);
});

export const setCompanyMenuTrialSettings = asyncHandler(async (req, res) => {
  await ensureSuperAdminTables();
  const companyId = Number(req.body.company_id);
  const settings = Array.isArray(req.body.settings) ? req.body.settings : [];
  if (!companyId) return sendError(res, "company_id is required", 400);

  for (const s of settings) {
    const menu_key = (s?.menu_key || "").toString().trim();
    if (!menu_key) continue;
    const trial_enabled = toBool(s?.trial_enabled) ? 1 : 0;
    const trial_days = Math.max(1, Math.min(365, parseInt(s?.trial_days, 10) || 30));

    const existing = await query(
      "SELECT id FROM company_menu_trial_settings WHERE company_id = ? AND menu_key = ?",
      [companyId, menu_key]
    );
    if (existing.length > 0) {
      await query(
        "UPDATE company_menu_trial_settings SET trial_enabled = ?, trial_days = ? WHERE company_id = ? AND menu_key = ?",
        [trial_enabled, trial_days, companyId, menu_key]
      );
    } else {
      await query(
        "INSERT INTO company_menu_trial_settings (company_id, menu_key, trial_enabled, trial_days) VALUES (?, ?, ?, ?)",
        [companyId, menu_key, trial_enabled, trial_days]
      );
    }
  }

  return sendSuccess(res, null, "Menu trial settings saved");
});

