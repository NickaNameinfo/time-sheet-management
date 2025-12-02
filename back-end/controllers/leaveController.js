import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const applyLeave = asyncHandler(async (req, res) => {
  const baseSql =
    "INSERT INTO leavedetails (`leaveType`,`leaveFrom`,`leaveTo`, `leaveHours`,`reason`, `employeeName`, `employeeId`";
  let sql = baseSql;
  const values = [
    req.body.leaveType,
    req.body.leaveFrom,
    req.body.leaveTo,
    req.body.leaveHours,
    req.body.reason,
    req.body.employeeName,
    req.body.employeeId,
  ];

  if (req.body.leaveStatus !== undefined) {
    sql += ", `leaveStatus`";
    values.push(req.body.leaveStatus);
  }
  if (req.body.totalLeaves !== undefined) {
    sql += ", `totalLeaves`";
    values.push(req.body.totalLeaves);
  }
  if (req.body.approverId !== undefined) {
    sql += ", `approverId`";
    values.push(req.body.approverId);
  }
  sql += ") VALUES (?)";

  const result = await query(sql, [values]);
  return sendSuccess(res, result, "Leave applied successfully");
});

export const applyCompOff = asyncHandler(async (req, res) => {
  // Format leaveFrom date - extract date part if it's a datetime string
  let leaveFrom = req.body.leaveFrom;
  if (leaveFrom) {
    // If it's a datetime string (ISO format), extract just the date part
    if (typeof leaveFrom === 'string' && leaveFrom.includes('T')) {
      leaveFrom = leaveFrom.split('T')[0];
    } else if (leaveFrom instanceof Date) {
      // If it's a Date object, format it as YYYY-MM-DD
      leaveFrom = leaveFrom.toISOString().split('T')[0];
    }
  }
  
  const baseSql =
    "INSERT INTO compoff (`leaveType`,`leaveFrom`,`reason`, `employeeName`, `employeeId`, `workHours`";
  let sql = baseSql;
  const values = [
    req.body.leaveType,
    leaveFrom,
    req.body.reason,
    req.body.employeeName,
    req.body.employeeId,
    req.body.workHours,
  ];

  if (req.body.leaveStatus !== undefined) {
    sql += ", `leaveStatus`";
    values.push(req.body.leaveStatus);
  }
  if (req.body.approverId !== undefined) {
    sql += ", `approverId`";
    values.push(req.body.approverId);
  }
  sql += ") VALUES (?)";

  const result = await query(sql, [values]);
  return sendSuccess(res, result, "Compensatory off applied successfully");
});

export const getLeaveDetails = asyncHandler(async (req, res) => {
  const { employeeId } = req.query;
  
  let sql = "SELECT * FROM leavedetails WHERE 1=1";
  const params = [];
  
  if (employeeId) {
    sql += " AND employeeId = ?";
    params.push(employeeId);
  }
  
  sql += " ORDER BY leaveFrom DESC, id DESC";
  
  const results = await query(sql, params);
  return sendSuccess(res, results);
});

export const getCompOffDetails = asyncHandler(async (req, res) => {
  const { employeeId } = req.query;
  
  let sql = "SELECT * FROM compoff WHERE 1=1";
  const params = [];
  
  if (employeeId) {
    sql += " AND employeeId = ?";
    params.push(employeeId);
  }
  
  sql += " ORDER BY leaveFrom DESC, id DESC";
  
  const results = await query(sql, params);
  return sendSuccess(res, results);
});

export const updateLeave = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    leaveType,
    leaveFrom,
    leaveTo,
    leaveHours,
    reason,
    employeeName,
    employeeId,
    leaveStatus,
    totalLeaves,
    approverId,
  } = req.body;

  const sql = `
    UPDATE leavedetails
    SET
      leaveType = ?,
      leaveFrom = ?,
      leaveTo = ?,
      leaveHours = ?,
      reason = ?,
      employeeName = ?,
      employeeId = ?,
      leaveStatus = ?,
      totalLeaves = ?,
      approverId = ?
    WHERE id = ?
  `;

  const values = [
    leaveType,
    leaveFrom,
    leaveTo,
    leaveHours,
    reason,
    employeeName,
    employeeId,
    leaveStatus,
    totalLeaves,
    approverId || null,
    id,
  ];

  await query(sql, values);
  return sendSuccess(res, null, "Leave updated successfully");
});

export const updateCompOff = asyncHandler(async (req, res) => {
  const { compOffId } = req.params;
  
  // Format leaveFrom date - extract date part if it's a datetime string
  let leaveFrom = req.body.leaveFrom;
  if (leaveFrom) {
    // If it's a datetime string (ISO format), extract just the date part
    if (typeof leaveFrom === 'string' && leaveFrom.includes('T')) {
      leaveFrom = leaveFrom.split('T')[0];
    } else if (leaveFrom instanceof Date) {
      // If it's a Date object, format it as YYYY-MM-DD
      leaveFrom = leaveFrom.toISOString().split('T')[0];
    }
  }
  
  const sql = `
    UPDATE compoff 
    SET 
      leaveType = ?,
      leaveFrom = ?,
      reason = ?,
      employeeName = ?,
      employeeId = ?,
      workHours = ?,
      eligibility = ?,
      leaveStatus = ?,
      approverId = ?
    WHERE id = ?
  `;
  const values = [
    req.body.leaveType,
    leaveFrom,
    req.body.reason,
    req.body.employeeName,
    req.body.employeeId,
    req.body.workHours,
    req.body.eligibility,
    req.body.leaveStatus,
    req.body.approverId || null,
    compOffId,
  ];

  await query(sql, values);
  return sendSuccess(res, null, "Compensatory off updated successfully");
});

export const deleteLeave = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM leavedetails WHERE id = ?";
  await query(sql, [id]);
  return sendSuccess(res, null, "Leave deleted successfully");
});

export const deleteCompOff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM compoff WHERE id = ?";
  await query(sql, [id]);
  return sendSuccess(res, null, "Compensatory off deleted successfully");
});

