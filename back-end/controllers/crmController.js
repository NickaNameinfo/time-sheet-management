import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Create CRM entry
export const createCrm = asyncHandler(async (req, res) => {
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
  } = req.body;

  // Validation
  if (!crmDate || !clientName) {
    return sendError(res, "CRM Date and Client Name are required", 400);
  }

  // Get the logged-in user's ID (employee.id from database)
  const createdBy = req.id;

  // Check if status, scheduleDate, and created_by columns exist
  let includeStatus = false;
  let includeScheduleDate = false;
  let includeCreatedBy = false;
  
  try {
    const columnCheckSql = `
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE table_schema = DATABASE() 
      AND table_name = 'crm_entries' 
      AND column_name IN ('status', 'scheduleDate', 'created_by')
    `;
    const columnCheck = await query(columnCheckSql);
    const existingColumns = columnCheck.map(col => col.COLUMN_NAME);
    includeStatus = existingColumns.includes('status');
    includeScheduleDate = existingColumns.includes('scheduleDate');
    includeCreatedBy = existingColumns.includes('created_by');
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

  if (includeCreatedBy) {
    sql += `, created_by`;
    values.push(createdBy);
  }

  sql += `, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?`;
  
  if (includeStatus) sql += `, ?`;
  if (includeScheduleDate) sql += `, ?`;
  if (includeCreatedBy) sql += `, ?`;
  
  sql += `, NOW(), NOW())`;

  const result = await query(sql, values);
  return sendSuccess(res, { id: result.insertId }, "CRM entry created successfully");
});

// Get all CRM entries
export const getCrmList = asyncHandler(async (req, res) => {
  const { startDate, endDate, clientName, employeeId } = req.query;
  const userRole = req.role?.toLowerCase();
  const userId = req.id; // employee.id from database

  // Check if created_by column exists
  let includeCreatedBy = false;
  try {
    const columnCheckSql = `
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE table_schema = DATABASE() 
      AND table_name = 'crm_entries' 
      AND column_name = 'created_by'
    `;
    const columnCheck = await query(columnCheckSql);
    includeCreatedBy = columnCheck.length > 0;
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

  // Role-based filtering
  // Sales employees can only see their own entries
  // Admin and TL can see all entries (or filter by employeeId)
  if (includeCreatedBy) {
    if (userRole === 'sales' || userRole === 'employee') {
      // Sales/Employee: only their own entries
      sql += " AND c.created_by = ?";
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

  const results = await query(sql, params);
  return sendSuccess(res, results);
});

// Get CRM entry by ID
export const getCrmById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sql = "SELECT * FROM crm_entries WHERE id = ?";
  const results = await query(sql, [id]);

  if (results.length === 0) {
    return sendError(res, "CRM entry not found", 404);
  }

  return sendSuccess(res, results[0]);
});

// Update CRM entry
export const updateCrm = asyncHandler(async (req, res) => {
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
  } = req.body;

  // Validation
  if (!crmDate || !clientName) {
    return sendError(res, "CRM Date and Client Name are required", 400);
  }

  // Check if status and scheduleDate columns exist
  let includeStatus = false;
  let includeScheduleDate = false;
  
  try {
    const columnCheckSql = `
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE table_schema = DATABASE() 
      AND table_name = 'crm_entries' 
      AND column_name IN ('status', 'scheduleDate')
    `;
    const columnCheck = await query(columnCheckSql);
    const existingColumns = columnCheck.map(col => col.COLUMN_NAME);
    includeStatus = existingColumns.includes('status');
    includeScheduleDate = existingColumns.includes('scheduleDate');
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

  sql += `, updatedAt = NOW() WHERE id = ?`;
  values.push(id);

  await query(sql, values);
  return sendSuccess(res, null, "CRM entry updated successfully");
});

// Delete CRM entry
export const deleteCrm = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM crm_entries WHERE id = ?";
  await query(sql, [id]);

  return sendSuccess(res, null, "CRM entry deleted successfully");
});

// Get CRM Summary
export const getCrmSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate, employeeId } = req.query;
  const userRole = req.role?.toLowerCase();
  const userId = req.id; // employee.id from database

  // Check if created_by column exists
  let includeCreatedBy = false;
  try {
    const columnCheckSql = `
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE table_schema = DATABASE() 
      AND table_name = 'crm_entries' 
      AND column_name = 'created_by'
    `;
    const columnCheck = await query(columnCheckSql);
    includeCreatedBy = columnCheck.length > 0;
  } catch (error) {
    console.warn("Could not check for created_by column:", error.message);
  }

  // Build base filter
  let baseFilter = "";
  const baseParams = [];

  // Role-based filtering
  if (includeCreatedBy) {
    if (userRole === 'sales' || userRole === 'employee') {
      // Sales/Employee: only their own entries
      baseFilter = "WHERE created_by = ?";
      baseParams.push(userId);
    } else if (userRole === 'admin' || userRole === 'tl' || userRole === 'teamlead') {
      // Admin/TL: can see all, but can filter by employeeId if provided
      if (employeeId) {
        baseFilter = "WHERE created_by = ?";
        baseParams.push(employeeId);
      }
    }
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
  const totalEntriesResult = await query(totalEntriesSql, allParams);
  const totalEntries = totalEntriesResult[0]?.count || 0;

  // Total unique clients
  const totalClientsSql = `SELECT COUNT(DISTINCT clientName) as count FROM crm_entries ${whereClause}`;
  const totalClientsResult = await query(totalClientsSql, allParams);
  const totalClients = totalClientsResult[0]?.count || 0;

  // This month
  const thisMonthWhere = whereClause 
    ? `${whereClause} AND YEAR(crmDate) = YEAR(CURRENT_DATE()) AND MONTH(crmDate) = MONTH(CURRENT_DATE())`
    : `WHERE YEAR(crmDate) = YEAR(CURRENT_DATE()) AND MONTH(crmDate) = MONTH(CURRENT_DATE())`;
  const thisMonthSql = `SELECT COUNT(*) as count FROM crm_entries ${thisMonthWhere}`;
  const thisMonthResult = await query(thisMonthSql, allParams);
  const thisMonth = thisMonthResult[0]?.count || 0;

  // This year
  const thisYearWhere = whereClause
    ? `${whereClause} AND YEAR(crmDate) = YEAR(CURRENT_DATE())`
    : `WHERE YEAR(crmDate) = YEAR(CURRENT_DATE())`;
  const thisYearSql = `SELECT COUNT(*) as count FROM crm_entries ${thisYearWhere}`;
  const thisYearResult = await query(thisYearSql, allParams);
  const thisYear = thisYearResult[0]?.count || 0;

  return sendSuccess(res, {
    totalEntries,
    totalClients,
    thisMonth,
    thisYear,
  });
});

