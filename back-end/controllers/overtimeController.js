import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Get OT Rules
export const getOTRules = asyncHandler(async (req, res) => {
  const { country } = req.query;
  let sql = "SELECT * FROM ot_rules WHERE is_active = TRUE";
  const params = [];

  if (country) {
    sql += " AND country = ?";
    params.push(country);
  }

  const results = await query(sql, params);
  return sendSuccess(res, results);
});

// Create/Update OT Rules
export const createOTRule = asyncHandler(async (req, res) => {
  const {
    country,
    daily_hours_limit,
    weekly_hours_limit,
    friday_multiplier,
    holiday_multiplier,
    night_shift_multiplier,
    night_shift_start,
    night_shift_end,
  } = req.body;

  // Check if rule exists for country
  const checkSql = "SELECT id FROM ot_rules WHERE country = ?";
  const existing = await query(checkSql, [country]);

  if (existing.length > 0) {
    // Update existing
    const updateSql = `
      UPDATE ot_rules SET
        daily_hours_limit = ?,
        weekly_hours_limit = ?,
        friday_multiplier = ?,
        holiday_multiplier = ?,
        night_shift_multiplier = ?,
        night_shift_start = ?,
        night_shift_end = ?
      WHERE country = ?
    `;
    await query(updateSql, [
      daily_hours_limit,
      weekly_hours_limit,
      friday_multiplier,
      holiday_multiplier,
      night_shift_multiplier,
      night_shift_start,
      night_shift_end,
      country,
    ]);
    return sendSuccess(res, null, "OT rules updated successfully");
  } else {
    // Create new
    const insertSql = `
      INSERT INTO ot_rules (
        country, daily_hours_limit, weekly_hours_limit,
        friday_multiplier, holiday_multiplier, night_shift_multiplier,
        night_shift_start, night_shift_end
      ) VALUES (?)
    `;
    await query(insertSql, [[
      country || "UAE",
      daily_hours_limit || 8.0,
      weekly_hours_limit || 48.0,
      friday_multiplier || 1.5,
      holiday_multiplier || 2.0,
      night_shift_multiplier || 1.25,
      night_shift_start || "22:00:00",
      night_shift_end || "06:00:00",
    ]]);
    return sendSuccess(res, null, "OT rules created successfully");
  }
});

// Calculate Overtime for Employee
export const calculateOvertime = asyncHandler(async (req, res) => {
  const { employeeId, startDate, endDate } = req.body;

  if (!employeeId || !startDate || !endDate) {
    return sendError(res, "employeeId, startDate, and endDate are required", 400);
  }

  // Get OT rules
  const rulesSql = "SELECT * FROM ot_rules WHERE is_active = TRUE LIMIT 1";
  const rules = await query(rulesSql);
  if (rules.length === 0) {
    return sendError(res, "OT rules not configured", 404);
  }
  const otRules = rules[0];

  // Get employee first (needed for userName to query workdetails)
  const employeeSql = "SELECT * FROM employee WHERE EMPID = ? OR id = ?";
  const employees = await query(employeeSql, [employeeId, employeeId]);
  if (employees.length === 0) {
    return sendError(res, "Employee not found", 404);
  }
  const employee = employees[0];

  // Get work details for the period
  // workdetails table uses userName to link to employee, not employeeNo
  // sentDate is stored as VARCHAR, so we extract the date part
  const workDetailsSql = `
    SELECT * FROM workdetails
    WHERE userName = ? 
    AND (
      DATE(STR_TO_DATE(SUBSTRING(sentDate, 1, 10), '%Y-%m-%d')) BETWEEN ? AND ?
      OR DATE(STR_TO_DATE(sentDate, '%Y-%m-%d')) BETWEEN ? AND ?
    )
    AND status = 'approved'
    ORDER BY sentDate
  `;
  const workDetails = await query(workDetailsSql, [
    employee.userName, 
    startDate, endDate,
    startDate, endDate
  ]);

  // Get billing rate
  const billingRateSql = `
    SELECT hourly_rate FROM billing_rates
    WHERE (employee_id = ? OR designation = ? OR discipline_code = ?)
    AND is_active = TRUE
    ORDER BY employee_id DESC, effective_date DESC
    LIMIT 1
  `;
  const billingRates = await query(billingRateSql, [
    employee.id,
    employee.designation,
    employee.discipline,
  ]);
  const hourlyRate = billingRates.length > 0 ? billingRates[0].hourly_rate : 0;

  const otRecords = [];
  let dailyOT = 0;
  let weeklyOT = 0;
  let totalOT = 0;

  // Group by date
  const workByDate = {};
  workDetails.forEach((work) => {
    const date = new Date(work.sentDate).toISOString().split("T")[0];
    if (!workByDate[date]) {
      workByDate[date] = [];
    }
    workByDate[date].push(work);
  });

  // Calculate OT for each day
  for (const [date, works] of Object.entries(workByDate)) {
    const totalHours = works.reduce((sum, w) => sum + parseFloat(w.totalHours || 0), 0);
    const workDate = new Date(date);
    const dayOfWeek = workDate.getDay(); // 0 = Sunday, 5 = Friday

    let otHours = 0;
    let otType = "";
    let otMultiplier = 1.0;

    // Daily OT
    if (totalHours > otRules.daily_hours_limit) {
      otHours = totalHours - otRules.daily_hours_limit;
      otType = "daily";
      dailyOT += otHours;
    }

    // Friday OT
    if (dayOfWeek === 5) {
      // Friday
      otMultiplier = otRules.friday_multiplier;
      otType = "friday";
    }

    // Night shift OT (if applicable)
    // Check if shift time falls in night shift hours
    const isNightShift = false; // This would need shift assignment data

    if (otHours > 0) {
      const otAmount = otHours * hourlyRate * otMultiplier;

      otRecords.push({
        employee_id: employee.id,
        attendance_date: date,
        regular_hours: Math.min(totalHours, otRules.daily_hours_limit),
        ot_hours: otHours,
        ot_type: otType,
        ot_rate: hourlyRate * otMultiplier,
        ot_amount: otAmount,
        approval_status: "pending",
      });

      totalOT += otHours;
    }
  }

  // Calculate weekly OT
  // Group by week
  const workByWeek = {};
  workDetails.forEach((work) => {
    const date = new Date(work.sentDate);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!workByWeek[weekKey]) {
      workByWeek[weekKey] = 0;
    }
    workByWeek[weekKey] += parseFloat(work.totalHours || 0);
  });

  // Check weekly limits
  for (const [weekStart, weeklyHours] of Object.entries(workByWeek)) {
    if (weeklyHours > otRules.weekly_hours_limit) {
      weeklyOT += weeklyHours - otRules.weekly_hours_limit;
    }
  }

  return sendSuccess(res, {
    employeeId: employee.id,
    period: { startDate, endDate },
    totalOTHours: totalOT,
    dailyOT,
    weeklyOT,
    otRecords,
    hourlyRate,
    estimatedOTAmount: totalOT * hourlyRate * otRules.friday_multiplier,
  });
});

// Get OT Records
export const getOTRecords = asyncHandler(async (req, res) => {
  const { employeeId, startDate, endDate, status } = req.query;
  let sql = "SELECT ot.*, e.employeeName, e.EMPID FROM ot_records ot";
  sql += " LEFT JOIN employee e ON ot.employee_id = e.id WHERE 1=1";
  const params = [];

  if (employeeId) {
    sql += " AND ot.employee_id = ?";
    params.push(employeeId);
  }
  if (startDate) {
    sql += " AND ot.attendance_date >= ?";
    params.push(startDate);
  }
  if (endDate) {
    sql += " AND ot.attendance_date <= ?";
    params.push(endDate);
  }
  if (status) {
    sql += " AND ot.approval_status = ?";
    params.push(status);
  }

  sql += " ORDER BY ot.attendance_date DESC";

  const results = await query(sql, params);
  return sendSuccess(res, results);
});

// Approve/Reject OT
export const approveOT = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, comments, approverId } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return sendError(res, "Status must be 'approved' or 'rejected'", 400);
  }

  const updateSql = `
    UPDATE ot_records SET
      approval_status = ?,
      approved_by = ?,
      approved_at = NOW(),
      comments = ?
    WHERE id = ?
  `;

  await query(updateSql, [status, approverId, comments, id]);

  // Add to approval history
  const otRecord = await query("SELECT * FROM ot_records WHERE id = ?", [id]);
  if (otRecord.length > 0) {
    const historySql = `
      INSERT INTO approval_history (entity_type, entity_id, approver_id, approval_level, status, comments)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await query(historySql, ["overtime", id, approverId, 1, status, comments]);
  }

  return sendSuccess(res, null, `OT ${status} successfully`);
});

// Bulk Insert OT Records
export const bulkInsertOTRecords = asyncHandler(async (req, res) => {
  const { otRecords } = req.body;

  if (!Array.isArray(otRecords) || otRecords.length === 0) {
    return sendError(res, "otRecords array is required", 400);
  }

  const insertSql = `
    INSERT INTO ot_records (
      employee_id, work_detail_id, attendance_date,
      regular_hours, ot_hours, ot_type, ot_rate, ot_amount, approval_status
    ) VALUES ?
  `;

  const values = otRecords.map((record) => [
    record.employee_id,
    record.work_detail_id || null,
    record.attendance_date,
    record.regular_hours || 0,
    record.ot_hours,
    record.ot_type,
    record.ot_rate,
    record.ot_amount,
    record.approval_status || "pending",
  ]);

  await query(insertSql, [values]);
  return sendSuccess(res, null, `${otRecords.length} OT records created successfully`);
});

