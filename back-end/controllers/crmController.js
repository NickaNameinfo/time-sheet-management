import crypto from "crypto";
import { query, companyQuery, getTenantQuery } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const hashApiKey = (key) =>
  crypto.createHash("sha256").update(String(key || "").trim(), "utf8").digest("hex");

const normalizeOrigin = (origin) =>
  String(origin || "")
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "");

async function ensureCrmLeadFromColumn(q) {
  try {
    await q(
      "ALTER TABLE crm_entries ADD COLUMN lead_from VARCHAR(120) NULL DEFAULT NULL AFTER notes"
    );
  } catch (e) {
    // duplicate column / table missing / permission errors are handled by caller flow
    if (e?.code !== "ER_DUP_FIELDNAME") {
      // swallow to keep backwards compatibility; create continues without hard failure
    }
  }
}

async function ensureCrmCompanyIdColumn(q) {
  try {
    await q("ALTER TABLE crm_entries ADD COLUMN company_id INT NULL DEFAULT NULL AFTER id");
    await q("CREATE INDEX idx_crm_company_id ON crm_entries (company_id)");
  } catch (e) {
    if (e?.code === "ER_DUP_FIELDNAME" || e?.code === "ER_DUP_KEYNAME") return;
    // swallow to keep backwards compatibility
  }
}

async function ensureCrmApiKeysTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS company_crm_api_keys (
      id INT NOT NULL AUTO_INCREMENT,
      company_id INT NOT NULL,
      key_label VARCHAR(120) NULL,
      key_hash CHAR(64) NOT NULL,
      allowed_origins TEXT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      expires_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_ccak_company (company_id),
      KEY idx_ccak_active (is_active),
      CONSTRAINT fk_ccak_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

// Create CRM entry
export const createCrm = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const {
    crmDate,
    clientName,
    contactPerson,
    phone,
    email,
    location,
    notes,
    status,
    scheduleDate,
    from: fromField,
    leadFrom,
    sourceFrom,
  } = req.body;

  // Validation
  if (!crmDate || !clientName) {
    return sendError(res, "CRM Date and Client Name are required", 400);
  }

  // Get the logged-in user's ID (employee.id from database)
  const createdBy = req.id;

  const fromValue = (fromField ?? leadFrom ?? sourceFrom ?? "").toString().trim() || null;
  if (fromValue) {
    await ensureCrmLeadFromColumn(q);
  }
  if (req.isCompanyUser && req.company_id) {
    await ensureCrmCompanyIdColumn(q);
  }

  // Check if status, scheduleDate, created_by, and lead_from columns exist
  let includeStatus = false;
  let includeScheduleDate = false;
  let includeCreatedBy = false;
  let includeLeadFrom = false;
  let includeCompanyId = false;
  
  try {
    const columnCheckSql = `
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE table_schema = DATABASE() 
      AND table_name = 'crm_entries' 
      AND column_name IN ('status', 'scheduleDate', 'created_by', 'lead_from', 'company_id')
    `;
    const columnCheck = await q(columnCheckSql);
    const existingColumns = columnCheck.map(col => col.COLUMN_NAME);
    includeStatus = existingColumns.includes('status');
    includeScheduleDate = existingColumns.includes('scheduleDate');
    includeCreatedBy = existingColumns.includes('created_by');
    includeLeadFrom = existingColumns.includes('lead_from');
    includeCompanyId = existingColumns.includes('company_id');
  } catch (error) {
    console.warn("Could not check for columns:", error.message);
  }

  let sql = `
    INSERT INTO crm_entries 
    (crmDate, clientName, contactPerson, phone, email, location, notes`;
  
  const values = [
    crmDate,
    clientName,
    contactPerson || null,
    phone || null,
    email || null,
    location || null,
    notes || null,
  ];

  if (includeStatus) {
    sql += `, status`;
    values.push(status || 'New');
  }

  if (includeScheduleDate) {
    sql += `, scheduleDate`;
    values.push(scheduleDate || null);
  }

  if (includeLeadFrom) {
    sql += `, lead_from`;
    values.push(fromValue);
  }
  if (includeCompanyId) {
    sql += `, company_id`;
    values.push(req.isCompanyUser && req.company_id ? Number(req.company_id) : null);
  }

  if (includeCreatedBy) {
    sql += `, created_by`;
    values.push(createdBy);
  }

  sql += `, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?`;
  
  if (includeStatus) sql += `, ?`;
  if (includeScheduleDate) sql += `, ?`;
  if (includeLeadFrom) sql += `, ?`;
  if (includeCompanyId) sql += `, ?`;
  if (includeCreatedBy) sql += `, ?`;
  
  sql += `, NOW(), NOW())`;

  const result = await q(sql, values);
  return sendSuccess(res, { id: result.insertId }, "CRM entry created successfully");
});

// Public CRM lead endpoint for external sales websites (API key based; no login token)
export const createCrmPublic = asyncHandler(async (req, res) => {
  await ensureCrmApiKeysTable();

  const companyCode = String(req.headers["x-company-code"] || "").trim();
  const apiKey = String(req.headers["x-api-key"] || "").trim();
  if (!companyCode || !apiKey) {
    return sendError(res, "x-company-code and x-api-key are required", 401);
  }

  const companyRows = await query(
    "SELECT id, company_code, company_name, status FROM companies WHERE LOWER(company_code) = LOWER(?) LIMIT 1",
    [companyCode]
  );
  if (companyRows.length === 0) return sendError(res, "Invalid company code", 401);
  const company = companyRows[0];
  if (String(company.status || "").toLowerCase() === "inactive") {
    return sendError(res, "Company is inactive", 403);
  }

  const keyHash = hashApiKey(apiKey);
  const keyRows = await query(
    `SELECT id, allowed_origins, expires_at, is_active
     FROM company_crm_api_keys
     WHERE company_id = ? AND key_hash = ? AND is_active = 1
     LIMIT 1`,
    [company.id, keyHash]
  );
  if (keyRows.length === 0) return sendError(res, "Invalid API key", 401);
  const keyRow = keyRows[0];
  if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
    return sendError(res, "API key expired", 401);
  }

  // Optional origin allow-list (comma/newline separated domains or full origins)
  const origin = normalizeOrigin(req.headers.origin || "");
  const allowRaw = String(keyRow.allowed_origins || "").trim();
  if (allowRaw) {
    const allowed = allowRaw
      .split(/[\n,]+/)
      .map((s) => normalizeOrigin(s))
      .filter(Boolean);
    if (origin && allowed.length > 0 && !allowed.includes(origin)) {
      return sendError(res, "Origin not allowed for this API key", 403);
    }
  }

  const {
    crmDate,
    clientName,
    contactPerson,
    phone,
    email,
    location,
    notes,
    status,
    scheduleDate,
    from: fromField,
    leadFrom,
    sourceFrom,
  } = req.body || {};

  if (!clientName) return sendError(res, "clientName is required", 400);
  const dateValue = crmDate || new Date().toISOString().slice(0, 10);

  const fromValue = (fromField ?? leadFrom ?? sourceFrom ?? "Website").toString().trim() || "Website";
  if (fromValue) {
    await ensureCrmLeadFromColumn(companyQuery);
  }
  await ensureCrmCompanyIdColumn(companyQuery);

  let includeStatus = false;
  let includeScheduleDate = false;
  let includeLeadFrom = false;
  let includeCreatedBy = false;
  let includeCompanyId = false;
  try {
    const cols = await companyQuery(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE table_schema = DATABASE()
         AND table_name = 'crm_entries'
         AND column_name IN ('status', 'scheduleDate', 'lead_from', 'created_by', 'company_id')`
    );
    const existing = cols.map((c) => c.COLUMN_NAME);
    includeStatus = existing.includes("status");
    includeScheduleDate = existing.includes("scheduleDate");
    includeLeadFrom = existing.includes("lead_from");
    includeCreatedBy = existing.includes("created_by");
    includeCompanyId = existing.includes("company_id");
  } catch (e) {
    console.warn("Could not check CRM columns for public insert:", e.message);
  }

  let sql = `
    INSERT INTO crm_entries
    (crmDate, clientName, contactPerson, phone, email, location, notes`;
  const values = [
    dateValue,
    clientName,
    contactPerson || null,
    phone || null,
    email || null,
    location || null,
    notes || null,
  ];
  if (includeStatus) {
    sql += `, status`;
    values.push(status || "New");
  }
  if (includeScheduleDate) {
    sql += `, scheduleDate`;
    values.push(scheduleDate || null);
  }
  if (includeLeadFrom) {
    sql += `, lead_from`;
    values.push(fromValue);
  }
  if (includeCompanyId) {
    sql += `, company_id`;
    values.push(Number(company.id));
  }
  if (includeCreatedBy) {
    sql += `, created_by`;
    values.push(null);
  }
  sql += `, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?`;
  if (includeStatus) sql += `, ?`;
  if (includeScheduleDate) sql += `, ?`;
  if (includeLeadFrom) sql += `, ?`;
  if (includeCompanyId) sql += `, ?`;
  if (includeCreatedBy) sql += `, ?`;
  sql += `, NOW(), NOW())`;

  const result = await companyQuery(sql, values);
  return sendSuccess(
    res,
    {
      id: result.insertId,
      company_code: company.company_code,
      company_name: company.company_name,
    },
    "CRM lead created successfully"
  );
});

// Get all CRM entries
export const getCrmList = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { startDate, endDate, clientName, employeeId } = req.query;
  const userRole = req.role?.toLowerCase();
  // Resolve userId (employee.id): prefer req.id; fallback to lookup by req.employeeId (EMPID) for sales/employee
  let userId = req.id;
  if (userId == null && req.employeeId != null) {
    const empRows = await q("SELECT id FROM employee WHERE EMPID = ?", [req.employeeId]);
    if (empRows.length > 0) userId = empRows[0].id;
  }

  // Check if created_by column exists
  let includeCreatedBy = false;
  let includeCompanyId = false;
  try {
    const columnCheckSql = `
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE table_schema = DATABASE() 
      AND table_name = 'crm_entries' 
      AND column_name IN ('created_by', 'company_id')
    `;
    const columnCheck = await q(columnCheckSql);
    const cols = columnCheck.map((c) => c.COLUMN_NAME);
    includeCreatedBy = cols.includes("created_by");
    includeCompanyId = cols.includes("company_id");
  } catch (error) {
    console.warn("Could not check for created_by column:", error.message);
  }

  // Build SQL query with JOIN to get employee name
  let sql = `
    SELECT 
      c.*,
      e.employeeName as createdByName,
      e.EMPID as createdByEmpId
    FROM crm_entries c
    LEFT JOIN employee e ON c.created_by = e.id
    WHERE 1=1
  `;
  const params = [];

  // Company logins: show their company rows; include legacy NULL company_id rows in tenant DB.
  if (req.isCompanyUser && req.company_id && includeCompanyId) {
    sql += " AND (c.company_id = ? OR c.company_id IS NULL)";
    params.push(Number(req.company_id));
  }

  // Role-based filtering
  // Sales/employee (any role containing "sales" or exactly "employee") see only their own entries
  // Admin and TL can see all entries (or filter by employeeId)
  const isSalesOrEmployee = userRole && (userRole === 'employee' || userRole.includes('sales'));
  if (includeCreatedBy) {
    if (isSalesOrEmployee) {
      if (userId == null) {
        return sendSuccess(res, [], "No CRM entries");
      }
      // Sales/Employee: their own entries + entries with no creator (legacy/new unassigned)
      sql += " AND (c.created_by = ? OR c.created_by IS NULL)";
      params.push(userId);
    } else if (userRole === 'admin' || userRole === 'tl' || userRole === 'teamlead') {
      // Admin/TL: can see all, but can filter by employeeId if provided
      if (employeeId) {
        sql += " AND c.created_by = ?";
        params.push(employeeId);
      }
    }
  }

  // Date filters
  if (startDate) {
    sql += " AND DATE(c.crmDate) >= ?";
    params.push(startDate);
  }

  if (endDate) {
    sql += " AND DATE(c.crmDate) <= ?";
    params.push(endDate);
  }

  // Client name filter
  if (clientName) {
    sql += " AND c.clientName LIKE ?";
    params.push(`%${clientName}%`);
  }

  sql += " ORDER BY c.crmDate DESC, c.createdAt DESC";

  const results = await q(sql, params);
  return sendSuccess(res, results);
});

// Get CRM entry by ID
export const getCrmById = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;

  const sql = "SELECT * FROM crm_entries WHERE id = ?";
  const results = await q(sql, [id]);

  if (results.length === 0) {
    return sendError(res, "CRM entry not found", 404);
  }

  return sendSuccess(res, results[0]);
});

// Update CRM entry
export const updateCrm = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const {
    crmDate,
    clientName,
    contactPerson,
    phone,
    email,
    location,
    notes,
    status,
    scheduleDate,
    from: fromField,
    leadFrom,
    sourceFrom,
  } = req.body;

  // Validation
  if (!crmDate || !clientName) {
    return sendError(res, "CRM Date and Client Name are required", 400);
  }

  const fromValue = (fromField ?? leadFrom ?? sourceFrom ?? "").toString().trim() || null;
  if (fromValue) {
    await ensureCrmLeadFromColumn(q);
  }

  // Check if status, scheduleDate, and lead_from columns exist
  let includeStatus = false;
  let includeScheduleDate = false;
  let includeLeadFrom = false;
  
  try {
    const columnCheckSql = `
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE table_schema = DATABASE() 
      AND table_name = 'crm_entries' 
      AND column_name IN ('status', 'scheduleDate', 'lead_from')
    `;
    const columnCheck = await q(columnCheckSql);
    const existingColumns = columnCheck.map(col => col.COLUMN_NAME);
    includeStatus = existingColumns.includes('status');
    includeScheduleDate = existingColumns.includes('scheduleDate');
    includeLeadFrom = existingColumns.includes('lead_from');
  } catch (error) {
    console.warn("Could not check for status columns:", error.message);
  }

  let sql = `
    UPDATE crm_entries 
    SET crmDate = ?,
        clientName = ?,
        contactPerson = ?,
        phone = ?,
        email = ?,
        location = ?,
        notes = ?`;
  
  const values = [
    crmDate,
    clientName,
    contactPerson || null,
    phone || null,
    email || null,
    location || null,
    notes || null,
  ];

  if (includeStatus) {
    sql += `, status = ?`;
    values.push(status || 'New');
  }

  if (includeScheduleDate) {
    sql += `, scheduleDate = ?`;
    values.push(scheduleDate || null);
  }

  if (includeLeadFrom) {
    sql += `, lead_from = ?`;
    values.push(fromValue);
  }

  sql += `, updatedAt = NOW() WHERE id = ?`;
  values.push(id);

  await q(sql, values);
  return sendSuccess(res, null, "CRM entry updated successfully");
});

// Delete CRM entry
export const deleteCrm = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;

  const sql = "DELETE FROM crm_entries WHERE id = ?";
  await q(sql, [id]);

  return sendSuccess(res, null, "CRM entry deleted successfully");
});

// Get CRM Summary
export const getCrmSummary = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { startDate, endDate, employeeId } = req.query;
  const userRole = req.role?.toLowerCase();
  let userId = req.id;
  if (userId == null && req.employeeId != null) {
    const empRows = await q("SELECT id FROM employee WHERE EMPID = ?", [req.employeeId]);
    if (empRows.length > 0) userId = empRows[0].id;
  }

  // Check if created_by and company_id columns exist
  let includeCreatedBy = false;
  let includeCompanyId = false;
  try {
    const columnCheckSql = `
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE table_schema = DATABASE() 
      AND table_name = 'crm_entries' 
      AND column_name IN ('created_by', 'company_id')
    `;
    const columnCheck = await q(columnCheckSql);
    const cols = columnCheck.map((c) => c.COLUMN_NAME);
    includeCreatedBy = cols.includes("created_by");
    includeCompanyId = cols.includes("company_id");
  } catch (error) {
    console.warn("Could not check for created_by column:", error.message);
  }

  // Build base filter
  let baseFilter = "";
  const baseParams = [];

  const isSalesOrEmployee = userRole && (userRole === 'employee' || userRole.includes('sales'));
  if (includeCreatedBy) {
    if (isSalesOrEmployee) {
      if (userId == null) {
        return sendSuccess(res, { totalEntries: 0, totalClients: 0, thisMonth: 0, thisYear: 0 });
      }
      baseFilter = "WHERE (created_by = ? OR created_by IS NULL)";
      baseParams.push(userId);
    } else if (userRole === 'admin' || userRole === 'tl' || userRole === 'teamlead') {
      // Admin/TL: can see all, but can filter by employeeId if provided
      if (employeeId) {
        baseFilter = "WHERE created_by = ?";
        baseParams.push(employeeId);
      }
    }
  }

  // Company portal summary: keep same visibility rule as list endpoint.
  if (req.isCompanyUser && req.company_id && includeCompanyId) {
    baseFilter += baseFilter ? " AND (company_id = ? OR company_id IS NULL)" : "WHERE (company_id = ? OR company_id IS NULL)";
    baseParams.push(Number(req.company_id));
  }

  // Date filters
  let dateFilter = "";
  const dateParams = [];

  if (startDate && endDate) {
    dateFilter = baseFilter ? " AND DATE(crmDate) >= ? AND DATE(crmDate) <= ?" : "WHERE DATE(crmDate) >= ? AND DATE(crmDate) <= ?";
    dateParams.push(startDate, endDate);
  } else if (startDate) {
    dateFilter = baseFilter ? " AND DATE(crmDate) >= ?" : "WHERE DATE(crmDate) >= ?";
    dateParams.push(startDate);
  } else if (endDate) {
    dateFilter = baseFilter ? " AND DATE(crmDate) <= ?" : "WHERE DATE(crmDate) <= ?";
    dateParams.push(endDate);
  }

  const whereClause = baseFilter + dateFilter;
  const allParams = [...baseParams, ...dateParams];

  // Total entries
  const totalEntriesSql = `SELECT COUNT(*) as count FROM crm_entries ${whereClause}`;
  const totalEntriesResult = await q(totalEntriesSql, allParams);
  const totalEntries = totalEntriesResult[0]?.count || 0;

  // Total unique clients
  const totalClientsSql = `SELECT COUNT(DISTINCT clientName) as count FROM crm_entries ${whereClause}`;
  const totalClientsResult = await q(totalClientsSql, allParams);
  const totalClients = totalClientsResult[0]?.count || 0;

  // This month
  const thisMonthWhere = whereClause 
    ? `${whereClause} AND YEAR(crmDate) = YEAR(CURRENT_DATE()) AND MONTH(crmDate) = MONTH(CURRENT_DATE())`
    : `WHERE YEAR(crmDate) = YEAR(CURRENT_DATE()) AND MONTH(crmDate) = MONTH(CURRENT_DATE())`;
  const thisMonthSql = `SELECT COUNT(*) as count FROM crm_entries ${thisMonthWhere}`;
  const thisMonthResult = await q(thisMonthSql, allParams);
  const thisMonth = thisMonthResult[0]?.count || 0;

  // This year
  const thisYearWhere = whereClause
    ? `${whereClause} AND YEAR(crmDate) = YEAR(CURRENT_DATE())`
    : `WHERE YEAR(crmDate) = YEAR(CURRENT_DATE())`;
  const thisYearSql = `SELECT COUNT(*) as count FROM crm_entries ${thisYearWhere}`;
  const thisYearResult = await q(thisYearSql, allParams);
  const thisYear = thisYearResult[0]?.count || 0;

  return sendSuccess(res, {
    totalEntries,
    totalClients,
    thisMonth,
    thisYear,
  });
});

