import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Get All Shifts
export const getShifts = asyncHandler(async (req, res) => {
  const { isActive } = req.query;
  let sql = "SELECT * FROM shifts WHERE 1=1";
  const params = [];

  if (isActive !== undefined) {
    sql += " AND is_active = ?";
    params.push(isActive === "true" ? 1 : 0);
  }

  sql += " ORDER BY start_time";

  const results = await query(sql, params);
  return sendSuccess(res, results);
});

// Create Shift
export const createShift = asyncHandler(async (req, res) => {
  const { name, startTime, endTime, breakDuration, breakStart, isNightShift } = req.body;

  if (!name || !startTime || !endTime) {
    return sendError(res, "name, startTime, and endTime are required", 400);
  }

  const insertSql = `
    INSERT INTO shifts (name, start_time, end_time, break_duration, break_start, is_night_shift)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  await query(insertSql, [
    name,
    startTime,
    endTime,
    breakDuration || 0,
    breakStart || null,
    isNightShift || false,
  ]);

  return sendSuccess(res, null, "Shift created successfully");
});

// Update Shift
export const updateShift = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, startTime, endTime, breakDuration, breakStart, isNightShift, isActive } =
    req.body;

  const updateSql = `
    UPDATE shifts SET
      name = COALESCE(?, name),
      start_time = COALESCE(?, start_time),
      end_time = COALESCE(?, end_time),
      break_duration = COALESCE(?, break_duration),
      break_start = COALESCE(?, break_start),
      is_night_shift = COALESCE(?, is_night_shift),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `;

  await query(updateSql, [
    name,
    startTime,
    endTime,
    breakDuration,
    breakStart,
    isNightShift,
    isActive,
    id,
  ]);

  return sendSuccess(res, null, "Shift updated successfully");
});

// Delete Shift
export const deleteShift = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if shift has active assignments
  const assignmentsSql = "SELECT COUNT(*) as count FROM shift_assignments WHERE shift_id = ? AND is_active = TRUE";
  const assignments = await query(assignmentsSql, [id]);

  if (assignments[0].count > 0) {
    return sendError(res, "Cannot delete shift with active assignments", 400);
  }

  await query("DELETE FROM shifts WHERE id = ?", [id]);
  return sendSuccess(res, null, "Shift deleted successfully");
});

// Assign Shift to Employee
export const assignShift = asyncHandler(async (req, res) => {
  const { employeeId, shiftId, assignmentDate, endDate } = req.body;

  if (!employeeId || !shiftId || !assignmentDate) {
    return sendError(res, "employeeId, shiftId, and assignmentDate are required", 400);
  }

  // Deactivate existing assignments for the period
  const deactivateSql = `
    UPDATE shift_assignments SET is_active = FALSE
    WHERE employee_id = ? 
    AND assignment_date <= COALESCE(?, '9999-12-31')
    AND (end_date IS NULL OR end_date >= ?)
  `;
  await query(deactivateSql, [employeeId, endDate || "9999-12-31", assignmentDate]);

  // Create new assignment
  const insertSql = `
    INSERT INTO shift_assignments (employee_id, shift_id, assignment_date, end_date)
    VALUES (?, ?, ?, ?)
  `;
  await query(insertSql, [employeeId, shiftId, assignmentDate, endDate || null]);

  return sendSuccess(res, null, "Shift assigned successfully");
});

// Get Shift Assignments
export const getShiftAssignments = asyncHandler(async (req, res) => {
  const { employeeId, shiftId, startDate, endDate, isActive } = req.query;

  let sql = `
    SELECT sa.*, e.employeeName, e.EMPID, s.name as shift_name, s.start_time, s.end_time
    FROM shift_assignments sa
    LEFT JOIN employee e ON sa.employee_id = e.id
    LEFT JOIN shifts s ON sa.shift_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (employeeId) {
    sql += " AND sa.employee_id = ?";
    params.push(employeeId);
  }
  if (shiftId) {
    sql += " AND sa.shift_id = ?";
    params.push(shiftId);
  }
  if (startDate) {
    sql += " AND sa.assignment_date >= ?";
    params.push(startDate);
  }
  if (endDate) {
    sql += " AND (sa.end_date IS NULL OR sa.end_date <= ?)";
    params.push(endDate);
  }
  if (isActive !== undefined) {
    sql += " AND sa.is_active = ?";
    params.push(isActive === "true" ? 1 : 0);
  }

  sql += " ORDER BY sa.assignment_date DESC";

  const results = await query(sql, params);
  return sendSuccess(res, results);
});

// Request Shift Swap
export const requestShiftSwap = asyncHandler(async (req, res) => {
  const { requesterId, swapWithId, originalShiftDate, swapShiftDate, comments } = req.body;

  if (!requesterId || !swapWithId || !originalShiftDate || !swapShiftDate) {
    return sendError(
      res,
      "requesterId, swapWithId, originalShiftDate, and swapShiftDate are required",
      400
    );
  }

  const insertSql = `
    INSERT INTO shift_swaps (requester_id, swap_with_id, original_shift_date, swap_shift_date, comments)
    VALUES (?, ?, ?, ?, ?)
  `;
  await query(insertSql, [requesterId, swapWithId, originalShiftDate, swapShiftDate, comments]);

  return sendSuccess(res, null, "Shift swap requested successfully");
});

// Approve/Reject Shift Swap
export const approveShiftSwap = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, approvedBy, comments } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return sendError(res, "Status must be 'approved' or 'rejected'", 400);
  }

  const updateSql = `
    UPDATE shift_swaps SET
      status = ?,
      approved_by = ?,
      comments = ?
    WHERE id = ?
  `;
  await query(updateSql, [status, approvedBy, comments, id]);

  // If approved, swap the shifts
  if (status === "approved") {
    const swapSql = "SELECT * FROM shift_swaps WHERE id = ?";
    const swap = await query(swapSql, [id]);

    if (swap.length > 0) {
      const s = swap[0];
      // Swap the assignments
      // This is a simplified version - you may need more complex logic
      await query(
        `UPDATE shift_assignments SET employee_id = ? WHERE employee_id = ? AND assignment_date = ?`,
        [s.swap_with_id, s.requester_id, s.original_shift_date]
      );
      await query(
        `UPDATE shift_assignments SET employee_id = ? WHERE employee_id = ? AND assignment_date = ?`,
        [s.requester_id, s.swap_with_id, s.swap_shift_date]
      );
    }
  }

  return sendSuccess(res, null, `Shift swap ${status} successfully`);
});

// Get Shift Swaps
export const getShiftSwaps = asyncHandler(async (req, res) => {
  const { employeeId, status } = req.query;

  let sql = `
    SELECT ss.*, 
           e1.employeeName as requester_name, e1.EMPID as requester_id,
           e2.employeeName as swap_with_name, e2.EMPID as swap_with_emp_id
    FROM shift_swaps ss
    LEFT JOIN employee e1 ON ss.requester_id = e1.id
    LEFT JOIN employee e2 ON ss.swap_with_id = e2.id
    WHERE 1=1
  `;
  const params = [];

  if (employeeId) {
    sql += " AND (ss.requester_id = ? OR ss.swap_with_id = ?)";
    params.push(employeeId, employeeId);
  }
  if (status) {
    sql += " AND ss.status = ?";
    params.push(status);
  }

  sql += " ORDER BY ss.created_at DESC";

  const results = await query(sql, params);
  return sendSuccess(res, results);
});

