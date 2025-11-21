import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Get Leave Balance
export const getLeaveBalance = asyncHandler(async (req, res) => {
  const { employeeId, year } = req.query;
  const currentYear = year || new Date().getFullYear();

  let sql = "SELECT * FROM leave_balances WHERE year = ?";
  const params = [currentYear];

  if (employeeId) {
    sql += " AND employee_id = ?";
    params.push(employeeId);
  }

  const results = await query(sql, params);
  return sendSuccess(res, results);
});

// Initialize Leave Balance for Employee
export const initializeLeaveBalance = asyncHandler(async (req, res) => {
  const { employeeId, leaveType, initialBalance, year } = req.body;

  if (!employeeId || !leaveType || initialBalance === undefined) {
    return sendError(res, "employeeId, leaveType, and initialBalance are required", 400);
  }

  const currentYear = year || new Date().getFullYear();

  // Check if balance exists
  const checkSql = `
    SELECT id FROM leave_balances 
    WHERE employee_id = ? AND leave_type = ? AND year = ?
  `;
  const existing = await query(checkSql, [employeeId, leaveType, currentYear]);

  if (existing.length > 0) {
    return sendError(res, "Leave balance already exists for this employee and year", 409);
  }

  const insertSql = `
    INSERT INTO leave_balances (employee_id, leave_type, balance, accrued, used, year)
    VALUES (?, ?, ?, ?, 0, ?)
  `;
  await query(insertSql, [employeeId, leaveType, initialBalance, initialBalance, currentYear]);

  return sendSuccess(res, null, "Leave balance initialized successfully");
});

// Accrue Leave
export const accrueLeave = asyncHandler(async (req, res) => {
  const { employeeId, leaveType, accrualAmount, accrualType, comments } = req.body;

  if (!employeeId || !leaveType || !accrualAmount) {
    return sendError(res, "employeeId, leaveType, and accrualAmount are required", 400);
  }

  const currentYear = new Date().getFullYear();

  // Insert accrual record
  const accrualSql = `
    INSERT INTO leave_accruals (employee_id, leave_type, accrual_date, accrual_amount, accrual_type, comments)
    VALUES (?, ?, CURDATE(), ?, ?, ?)
  `;
  await query(accrualSql, [employeeId, leaveType, accrualAmount, accrualType || "manual", comments]);

  // Update leave balance
  const updateSql = `
    UPDATE leave_balances SET
      balance = balance + ?,
      accrued = accrued + ?
    WHERE employee_id = ? AND leave_type = ? AND year = ?
  `;
  const result = await query(updateSql, [
    accrualAmount,
    accrualAmount,
    employeeId,
    leaveType,
    currentYear,
  ]);

  if (result.affectedRows === 0) {
    // Initialize if doesn't exist
    await query(
      `INSERT INTO leave_balances (employee_id, leave_type, balance, accrued, used, year)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [employeeId, leaveType, accrualAmount, accrualAmount, currentYear]
    );
  }

  return sendSuccess(res, null, "Leave accrued successfully");
});

// Use Leave (called when leave is approved)
export const useLeave = asyncHandler(async (req, res) => {
  const { employeeId, leaveType, leaveHours, year } = req.body;

  if (!employeeId || !leaveType || !leaveHours) {
    return sendError(res, "employeeId, leaveType, and leaveHours are required", 400);
  }

  const currentYear = year || new Date().getFullYear();

  // Check balance
  const balanceSql = `
    SELECT balance FROM leave_balances
    WHERE employee_id = ? AND leave_type = ? AND year = ?
  `;
  const balance = await query(balanceSql, [employeeId, leaveType, currentYear]);

  if (balance.length === 0) {
    return sendError(res, "Leave balance not found", 404);
  }

  const availableBalance = parseFloat(balance[0].balance);
  const requestedHours = parseFloat(leaveHours);

  if (availableBalance < requestedHours) {
    return sendError(
      res,
      `Insufficient leave balance. Available: ${availableBalance}, Requested: ${requestedHours}`,
      400
    );
  }

  // Update balance
  const updateSql = `
    UPDATE leave_balances SET
      balance = balance - ?,
      used = used + ?
    WHERE employee_id = ? AND leave_type = ? AND year = ?
  `;
  await query(updateSql, [requestedHours, requestedHours, employeeId, leaveType, currentYear]);

  return sendSuccess(res, null, "Leave balance updated successfully");
});

// Get Leave Accruals
export const getLeaveAccruals = asyncHandler(async (req, res) => {
  const { employeeId, leaveType, startDate, endDate } = req.query;

  let sql = `
    SELECT la.*, e.employeeName, e.EMPID
    FROM leave_accruals la
    LEFT JOIN employee e ON la.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (employeeId) {
    sql += " AND la.employee_id = ?";
    params.push(employeeId);
  }
  if (leaveType) {
    sql += " AND la.leave_type = ?";
    params.push(leaveType);
  }
  if (startDate) {
    sql += " AND la.accrual_date >= ?";
    params.push(startDate);
  }
  if (endDate) {
    sql += " AND la.accrual_date <= ?";
    params.push(endDate);
  }

  sql += " ORDER BY la.accrual_date DESC";

  const results = await query(sql, params);
  return sendSuccess(res, results);
});

// Upload Leave Document
export const uploadLeaveDocument = asyncHandler(async (req, res) => {
  const { leaveId, documentType } = req.body;
  const documentPath = req.file ? req.file.filename : req.body.documentPath;

  if (!leaveId || !documentPath) {
    return sendError(res, "leaveId and document are required", 400);
  }

  const insertSql = `
    INSERT INTO leave_documents (leave_id, document_type, document_path)
    VALUES (?, ?, ?)
  `;
  await query(insertSql, [leaveId, documentType || "other", documentPath]);

  return sendSuccess(res, null, "Document uploaded successfully");
});

// Get Leave Documents
export const getLeaveDocuments = asyncHandler(async (req, res) => {
  const { leaveId } = req.params;

  const sql = "SELECT * FROM leave_documents WHERE leave_id = ?";
  const results = await query(sql, [leaveId]);

  return sendSuccess(res, results);
});

