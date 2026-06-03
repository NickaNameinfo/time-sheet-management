import { getTenantQuery } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  mapWorkDetailRows,
  WORKDETAILS_CLOCK_SQL,
  getWorkDetailsQuery,
} from "../utils/workdetailsClock.js";
import { sqlActiveEmployeesOnly } from "../utils/employeeFilters.js";
import {
  computeExpectedPeriodHours,
  enrichPeriodCalendarDays,
  computeHolidayPayMetrics,
  fetchPayrollHolidaySettings,
} from "../utils/governmentHolidays.js";

const STANDARD_MONTH_HOURS = 176;
const STANDARD_DAILY_HOURS = 8;

function parseDateRange(startDate, endDate) {
  if (!startDate || !endDate) return null;
  return { startDate, endDate };
}

function entryWorkDate(entry) {
  const raw = entry.clockInTime || entry.sentDate;
  if (!raw) return null;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  const s = String(raw).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

/** Saturday / Sunday from YYYY-MM-DD (local calendar). */
export function isWeekendDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return dow === 0 || dow === 6;
}

export function dayOfWeekLabel(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" });
}

/** All dates in period with weekend flags (month calendar). */
export function buildPeriodCalendar(startDate, endDate) {
  if (!startDate || !endDate) return [];
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const cur = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const days = [];
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    const date = `${y}-${m}-${d}`;
    const dow = cur.getDay();
    days.push({
      date,
      dayOfWeek: cur.toLocaleDateString("en-US", { weekday: "short" }),
      dayOfMonth: cur.getDate(),
      isWeekend: dow === 0 || dow === 6,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

/** Weekdays: 8h cap regular + extra. Weekends (Sat/Sun): all hours = weekend bucket. */
export function summarizeAttendance(entries) {
  const list = entries || [];
  let checkInCount = 0;
  let checkOutCount = 0;
  const hoursByDay = new Map();

  for (const e of list) {
    if (e.hasClockIn) checkInCount += 1;
    if (e.hasClockOut) checkOutCount += 1;
    const day = entryWorkDate(e);
    if (!day) continue;
    const h = parseFloat(e.calculatedHours) || parseFloat(e.totalHours) || 0;
    hoursByDay.set(day, (hoursByDay.get(day) || 0) + h);
  }

  const dailyBreakdown = [...hoursByDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayTotal]) => {
      const dayTotalHours = Number(dayTotal.toFixed(2));
      const weekend = isWeekendDate(date);
      if (weekend) {
        return {
          date,
          dayOfWeek: dayOfWeekLabel(date),
          isWeekend: true,
          dayTotalHours,
          weekendHours: dayTotalHours,
          regularHours: 0,
          extraHours: 0,
        };
      }
      const regularHours = Number(Math.min(dayTotalHours, STANDARD_DAILY_HOURS).toFixed(2));
      const extraHours = Number(Math.max(0, dayTotalHours - STANDARD_DAILY_HOURS).toFixed(2));
      return {
        date,
        dayOfWeek: dayOfWeekLabel(date),
        isWeekend: false,
        dayTotalHours,
        weekendHours: 0,
        regularHours,
        extraHours,
      };
    });

  const regularHours = Number(
    dailyBreakdown.reduce((s, d) => s + d.regularHours, 0).toFixed(2)
  );
  const extraHours = Number(
    dailyBreakdown.reduce((s, d) => s + d.extraHours, 0).toFixed(2)
  );
  const weekendHours = Number(
    dailyBreakdown.reduce((s, d) => s + d.weekendHours, 0).toFixed(2)
  );
  const totalHours = Number((regularHours + extraHours + weekendHours).toFixed(2));

  const entriesWithDay = list.map((e) => {
    const day = entryWorkDate(e);
    return {
      ...e,
      workDate: day,
      isWeekend: day ? isWeekendDate(day) : false,
      dayOfWeek: day ? dayOfWeekLabel(day) : "",
    };
  });

  return {
    checkInCount,
    checkOutCount,
    totalHours,
    regularHours,
    extraHours,
    weekendHours,
    standardDailyHours: STANDARD_DAILY_HOURS,
    dailyBreakdown,
    entries: entriesWithDay,
  };
}

async function fetchAttendanceHours(q, userName, startDate, endDate) {
  const sql = `
    SELECT
      wd.id,
      wd.employeeName,
      wd.userName,
      wd.employeeNo,
      wd.totalHours,
      wd.clockInTime,
      wd.clockOutTime,
      wd.sentDate,
      wd.status,
      wd.projectName,
      wd.referenceNo,
      wd.areaofWork,
      wd.variation,
      wd.taskNo,
      wd.approvedDate,
      wd.approverId,
      ${WORKDETAILS_CLOCK_SQL}
    FROM workdetails wd
    WHERE wd.userName = ?
      AND (
        DATE(STR_TO_DATE(SUBSTRING(wd.sentDate, 1, 10), '%Y-%m-%d')) BETWEEN ? AND ?
        OR DATE(STR_TO_DATE(wd.sentDate, '%Y-%m-%d')) BETWEEN ? AND ?
        OR (wd.clockInTime IS NOT NULL AND DATE(wd.clockInTime) BETWEEN ? AND ?)
      )
    ORDER BY wd.sentDate DESC, wd.id DESC
  `;
  const rows = await q(sql, [
    userName,
    startDate,
    endDate,
    startDate,
    endDate,
    startDate,
    endDate,
  ]);

  const entries = mapWorkDetailRows(rows).map((row) => ({
    id: row.id,
    employeeName: row.employeeName,
    userName: row.userName,
    employeeNo: row.employeeNo,
    sentDate: row.sentDate,
    clockInTime: row.clockInTime,
    clockOutTime: row.clockOutTime,
    approvedDate: row.approvedDate,
    totalHours: row.totalHours,
    calculatedHours: row.calculatedHours,
    status: row.status,
    projectName: row.projectName,
    referenceNo: row.referenceNo,
    areaOfWork: row.areaofWork || row.areaOfWork,
    variation: row.variation,
    taskNo: row.taskNo,
    hasClockIn: row.hasClockIn,
    hasClockOut: row.hasClockOut,
  }));

  return summarizeAttendance(entries);
}

function computePayFromSalary(
  monthlySalary,
  regularHours,
  extraHours = 0,
  weekendHours = 0,
  expectedHours = STANDARD_MONTH_HOURS,
  holidayHours = 0
) {
  const salary = parseFloat(monthlySalary) || 0;
  const regular = parseFloat(regularHours) || 0;
  const extra = parseFloat(extraHours) || 0;
  const weekend = parseFloat(weekendHours) || 0;
  const holiday = parseFloat(holidayHours) || 0;
  const expected = parseFloat(expectedHours) || STANDARD_MONTH_HOURS;

  if (salary <= 0) {
    return {
      expectedHours: expected,
      hourlyRate: 0,
      regularPay: 0,
      extraPay: 0,
      weekendPay: 0,
      holidayHours: holiday,
      holidayPay: 0,
      monthPayable: 0,
      attendancePay: 0,
      finalAmount: 0,
    };
  }

  const hourlyRate = salary / expected;
  let regularPay = regular * hourlyRate;
  const extraPay = extra * hourlyRate;
  const weekendPay = weekend * hourlyRate;
  const holidayPay = holiday * hourlyRate;
  const payableRegularHours = Math.min(regular, expected);
  if (regular >= expected) {
    regularPay = salary;
  } else {
    regularPay = payableRegularHours * hourlyRate;
  }
  const attendancePay = regularPay + extraPay + weekendPay + holidayPay;
  const monthPayable = Number((regularPay + holidayPay).toFixed(2));

  return {
    expectedHours: expected,
    hourlyRate: Number(hourlyRate.toFixed(4)),
    regularPay: Number(regularPay.toFixed(2)),
    extraPay: Number(extraPay.toFixed(2)),
    weekendPay: Number(weekendPay.toFixed(2)),
    holidayHours: Number(holiday.toFixed(2)),
    holidayPay: Number(holidayPay.toFixed(2)),
    monthPayable,
    attendancePay: Number(attendancePay.toFixed(2)),
    finalAmount: monthPayable,
  };
}

async function ensurePayslipTable(q) {
  await q(`
    CREATE TABLE IF NOT EXISTS employee_payslips (
      id INT PRIMARY KEY AUTO_INCREMENT,
      employee_id INT NOT NULL,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      base_salary DECIMAL(12,2) DEFAULT 0,
      total_hours DECIMAL(10,2) DEFAULT 0,
      expected_hours DECIMAL(10,2) DEFAULT 176,
      hourly_rate DECIMAL(12,4) DEFAULT 0,
      attendance_pay DECIMAL(12,2) DEFAULT 0,
      adjustments DECIMAL(12,2) DEFAULT 0,
      final_amount DECIMAL(12,2) DEFAULT 0,
      status VARCHAR(30) DEFAULT 'draft',
      notes TEXT,
      payslip_detail JSON NULL,
      updated_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_employee_payslip_period (employee_id, period_start, period_end),
      KEY idx_payslip_period (period_start, period_end)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  try {
    await q("ALTER TABLE employee_payslips ADD COLUMN payslip_detail JSON NULL");
  } catch (e) {
    if (e?.code !== "ER_DUP_FIELDNAME") {
      // ignore if table was just created with column
    }
  }
}

function parsePayslipDetail(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizePayslipStatus(status) {
  return String(status || "draft").toLowerCase().trim();
}

/** Admin / HR can manage payslips; employees may only read their own when status is paid. */
export function isPayrollAdmin(req) {
  const role = String(req.role || "").toLowerCase();
  const companyRole = String(req.company_role || req.company_menu_role || "").toLowerCase();
  if (["admin", "hr", "company_admin"].includes(role)) return true;
  if (["admin", "hr"].includes(companyRole)) return true;
  if (req.isCompanyUser && (req.company_user_id != null || req.company_role) && !req.employeeId) {
    return true;
  }
  return false;
}

async function resolveRequestingEmployeePk(q, req) {
  const tryResolve = async (raw) => {
    if (raw == null || String(raw).trim() === "") return null;
    const rows = await q("SELECT id FROM employee WHERE id = ? OR EMPID = ? LIMIT 1", [
      raw,
      raw,
    ]);
    return rows.length ? Number(rows[0].id) : null;
  };

  // JWT employeeId is usually EMPID; req.id is employee.id (employee login / linked admin row)
  const fromEmployeeId = await tryResolve(req.employeeId);
  if (fromEmployeeId != null) return fromEmployeeId;

  const fromId = await tryResolve(req.id);
  if (fromId != null) return fromId;

  // Company portal logins often have only userName/email on the token
  const loginKey = String(req.userName || "").trim();
  if (!loginKey) return null;

  const rows = await q(
    `SELECT id FROM employee
     WHERE LOWER(TRIM(userName)) = LOWER(TRIM(?))
        OR LOWER(TRIM(employeeEmail)) = LOWER(TRIM(?))
     ORDER BY id DESC
     LIMIT 1`,
    [loginKey, loginKey]
  );
  return rows.length ? Number(rows[0].id) : null;
}

function formatPeriodLabel(startDate) {
  if (!startDate) return "";
  const d = new Date(startDate);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  return String(startDate).slice(0, 7);
}

async function fetchCompanyHeader(req) {
  const companyId = req.company_id;
  if (!companyId) return { name: null, address: null, phone: null };
  try {
    const { query } = await import("../config/database.js");
    const rows = await query(
      "SELECT company_name FROM companies WHERE id = ? LIMIT 1",
      [Number(companyId)]
    );
    if (rows?.length) {
      return { name: rows[0].company_name, address: null, phone: null };
    }
  } catch {
    /* companies table optional */
  }
  return { name: null, address: null, phone: null };
}

export const listSalaryPayslips = asyncHandler(async (req, res) => {
  if (!isPayrollAdmin(req)) {
    return sendError(res, "Insufficient permissions", 403);
  }
  const q = getTenantQuery(req);
  const workQ = getWorkDetailsQuery(req);
  const range = parseDateRange(req.query.startDate, req.query.endDate);
  if (!range) {
    return sendError(res, "startDate and endDate are required", 400);
  }

  const { startDate, endDate } = range;
  const { employeeId } = req.query;
  const { country: payrollCountry, customHolidays } = await fetchPayrollHolidaySettings(q);
  const expectedPeriodHours = computeExpectedPeriodHours(
    startDate,
    endDate,
    payrollCountry,
    customHolidays
  );

  await ensurePayslipTable(q);

  let employeeSql = `
    SELECT id, EMPID, employeeName, designation, salary, userName, employeeStatus
    FROM employee
    WHERE 1=1
    ${sqlActiveEmployeesOnly("employeeStatus")}
  `;
  const employeeParams = [];
  if (employeeId) {
    employeeSql += " AND (id = ? OR EMPID = ?)";
    employeeParams.push(employeeId, employeeId);
  }
  employeeSql += " ORDER BY employeeName ASC";

  const employees = await q(employeeSql, employeeParams);

  const payslipSql = `
    SELECT * FROM employee_payslips
    WHERE period_start = ? AND period_end = ?
  `;
  const payslips = await q(payslipSql, [startDate, endDate]);
  const payslipByEmployee = new Map(payslips.map((p) => [p.employee_id, p]));

  const result = [];

  for (const emp of employees) {
    const summary = await fetchAttendanceHours(workQ, emp.userName, startDate, endDate);
    const baseSalary = parseFloat(emp.salary) || 0;
    const holidayMeta = computeHolidayPayMetrics(
      baseSalary,
      startDate,
      endDate,
      payrollCountry,
      expectedPeriodHours,
      customHolidays
    );
    const calc = computePayFromSalary(
      baseSalary,
      summary.regularHours,
      summary.extraHours,
      summary.weekendHours,
      expectedPeriodHours,
      holidayMeta.holidayHours
    );
    const saved = payslipByEmployee.get(emp.id);
    const requiredHours = expectedPeriodHours;
    const loggedHours = Number(summary.regularHours) || 0;
    const missingHours = Number(Math.max(0, requiredHours - loggedHours).toFixed(2));

    const adjustments = saved ? parseFloat(saved.adjustments) || 0 : 0;
    const attendancePay = saved ? parseFloat(saved.attendance_pay) : calc.attendancePay;
    const monthPayable = calc.monthPayable;
    const finalAmount =
      saved && saved.final_amount != null
        ? parseFloat(saved.final_amount)
        : Number((monthPayable + adjustments).toFixed(2));

    result.push({
      employeeId: emp.id,
      empId: emp.EMPID,
      employeeName: emp.employeeName,
      designation: emp.designation,
      totalSalary: baseSalary,
      baseSalary,
      monthPayable,
      checkInCount: summary.checkInCount,
      checkOutCount: summary.checkOutCount,
      totalHours: saved ? parseFloat(saved.total_hours) : summary.totalHours,
      regularHours: summary.regularHours,
      extraHours: summary.extraHours,
      weekendHours: summary.weekendHours,
      standardDailyHours: summary.standardDailyHours,
      expectedHours: requiredHours,
      requiredHours,
      loggedHours,
      missingHours,
      weekdaysInPeriod: buildPeriodCalendar(startDate, endDate).filter((d) => !d.isWeekend).length,
      holidayCount: holidayMeta.holidayCount,
      hourlyRate: saved ? parseFloat(saved.hourly_rate) : calc.hourlyRate,
      regularPay: calc.regularPay,
      extraPay: calc.extraPay,
      weekendPay: calc.weekendPay,
      holidayHours: calc.holidayHours,
      holidayPay: calc.holidayPay,
      attendancePay,
      adjustments,
      finalAmount,
      status: saved?.status || "draft",
      notes: saved?.notes || "",
      payslipId: saved?.id || null,
      period: { startDate, endDate },
    });
  }

  const periodCalendar = enrichPeriodCalendarDays(
    buildPeriodCalendar(startDate, endDate),
    payrollCountry,
    customHolidays
  );
  const workingDaysInPeriod = periodCalendar.filter((d) => d.isWorkingDay).length;
  const periodHolidayMeta = computeHolidayPayMetrics(
    0,
    startDate,
    endDate,
    payrollCountry,
    expectedPeriodHours,
    customHolidays
  );

  return sendSuccess(res, {
    employees: result,
    periodCalendar,
    payrollCountry,
    periodSummary: {
      requiredHours: expectedPeriodHours,
      weekdaysInPeriod: periodCalendar.filter((d) => !d.isWeekend).length,
      workingDaysInPeriod,
      holidayCount: periodHolidayMeta.holidayCount,
      holidayHours: periodHolidayMeta.holidayHours,
      governmentHolidays: periodHolidayMeta.allHolidays,
      payableHolidays: periodHolidayMeta.holidays,
      payrollCountry,
      standardDailyHours: STANDARD_DAILY_HOURS,
    },
  });
});

export const getSalaryPayslipDetail = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const range = parseDateRange(req.query.startDate, req.query.endDate);
  if (!range) {
    return sendError(res, "startDate and endDate are required", 400);
  }

  const employeePk = req.params.employeeId;
  const { startDate, endDate } = range;

  await ensurePayslipTable(q);

  const requesterPk = await resolveRequestingEmployeePk(q, req);
  const payrollAdmin = isPayrollAdmin(req);

  const empRows = await q(
    `SELECT id, EMPID, employeeName, designation, salary, userName, date AS dateOfJoining
     FROM employee WHERE id = ? OR EMPID = ? LIMIT 1`,
    [employeePk, employeePk]
  );
  if (!empRows.length) {
    return sendError(res, "Employee not found", 404);
  }

  const emp = empRows[0];
  const workQ = getWorkDetailsQuery(req);
  const { country: payrollCountry, customHolidays } = await fetchPayrollHolidaySettings(q);
  const summary = await fetchAttendanceHours(workQ, emp.userName, startDate, endDate);
  const expectedPeriodHours = computeExpectedPeriodHours(
    startDate,
    endDate,
    payrollCountry,
    customHolidays
  );
  const holidayMeta = computeHolidayPayMetrics(
    emp.salary,
    startDate,
    endDate,
    payrollCountry,
    expectedPeriodHours,
    customHolidays
  );
  const calc = computePayFromSalary(
    emp.salary,
    summary.regularHours,
    summary.extraHours,
    summary.weekendHours,
    expectedPeriodHours,
    holidayMeta.holidayHours
  );

  const savedRows = await q(
    "SELECT * FROM employee_payslips WHERE employee_id = ? AND period_start = ? AND period_end = ? LIMIT 1",
    [emp.id, startDate, endDate]
  );
  const saved = savedRows[0];

  if (requesterPk != null && !payrollAdmin) {
    if (requesterPk !== Number(emp.id)) {
      return sendError(res, "You can only view your own payslip", 403);
    }
    if (normalizePayslipStatus(saved?.status) !== "paid") {
      return sendError(
        res,
        "Payslip download is available only after payroll marks it as Paid",
        403
      );
    }
  }

  const adjustments = saved ? parseFloat(saved.adjustments) || 0 : 0;
  const payslipDetail = saved ? parsePayslipDetail(saved.payslip_detail) : null;
  const monthlySalary = parseFloat(emp.salary) || 0;

  // Payable always follows live attendance (regular + govt holiday pay), same as admin grid.
  const monthPayable = calc.monthPayable;

  const attendancePayTotal = monthPayable;
  let finalAmount = Number((monthPayable + adjustments).toFixed(2));
  if (saved && saved.final_amount != null) {
    const savedFinal = parseFloat(saved.final_amount);
    if (!Number.isNaN(savedFinal)) {
      // Ignore legacy rows where final_amount was stored as profile salary instead of payable.
      const looksLikeProfileOnly =
        Math.abs(savedFinal - monthlySalary) < 1 && Math.abs(savedFinal - monthPayable) > 1;
      if (!looksLikeProfileOnly) {
        finalAmount = savedFinal;
      }
    }
  }
  let companyHeader = await fetchCompanyHeader(req);
  if (payslipDetail?.company?.name) {
    companyHeader = {
      name: payslipDetail.company.name || companyHeader.name,
      address: payslipDetail.company.address || companyHeader.address,
      phone: payslipDetail.company.phone || companyHeader.phone,
    };
  }

  return sendSuccess(res, {
    employee: {
      id: emp.id,
      empId: emp.EMPID,
      employeeName: emp.employeeName,
      designation: emp.designation,
      dateOfJoining: emp.dateOfJoining,
      baseSalary: monthlySalary,
    },
    period: payslipDetail?.period?.startDate
      ? { startDate: payslipDetail.period.startDate, endDate: payslipDetail.period.endDate }
      : { startDate, endDate },
    monthlySalary,
    totalSalary: monthlySalary,
    regularPay: calc.regularPay,
    weekendPay: calc.weekendPay,
    extraPay: calc.extraPay,
    holidayHours: calc.holidayHours,
    holidayPay: calc.holidayPay,
    governmentHolidays: holidayMeta.allHolidays,
    payableHolidays: holidayMeta.holidays,
    payrollCountry,
    monthPayable,
    grossSalary: monthPayable,
    finalAmount,
    attendancePay: attendancePayTotal,
    attendancePayBreakdown: {
      totalSalary: monthlySalary,
      regularPay: calc.regularPay,
      weekendPay: calc.weekendPay,
      extraPay: calc.extraPay,
      holidayPay: calc.holidayPay,
      monthPayable: calc.monthPayable,
    },
    adjustments,
    company: companyHeader,
    payslipDetail,
    status: saved ? normalizePayslipStatus(saved.status) : "draft",
    payslipId: saved?.id || null,
    requiredHours: expectedPeriodHours,
    loggedHours: Number(summary.regularHours) || 0,
    missingHours: Number(
      Math.max(0, expectedPeriodHours - (Number(summary.regularHours) || 0)).toFixed(2)
    ),
    attendance: {
      regularHours: summary.regularHours,
      extraHours: summary.extraHours,
      weekendHours: summary.weekendHours,
      totalHours: summary.totalHours,
    },
  });
});

export const getEmployeeAttendanceForPayslip = asyncHandler(async (req, res) => {
  if (!isPayrollAdmin(req)) {
    return sendError(res, "Insufficient permissions", 403);
  }
  const q = getTenantQuery(req);
  const workQ = getWorkDetailsQuery(req);
  const range = parseDateRange(req.query.startDate, req.query.endDate);
  if (!range) {
    return sendError(res, "startDate and endDate are required", 400);
  }

  const employeePk = req.params.employeeId;
  const empRows = await q(
    "SELECT id, EMPID, employeeName, salary, userName FROM employee WHERE id = ? OR EMPID = ? LIMIT 1",
    [employeePk, employeePk]
  );
  if (!empRows.length) {
    return sendError(res, "Employee not found", 404);
  }

  const emp = empRows[0];
  const { startDate, endDate } = range;
  const { country: payrollCountry, customHolidays } = await fetchPayrollHolidaySettings(q);
  const summary = await fetchAttendanceHours(workQ, emp.userName, startDate, endDate);
  const expectedPeriodHours = computeExpectedPeriodHours(
    startDate,
    endDate,
    payrollCountry,
    customHolidays
  );
  const holidayMeta = computeHolidayPayMetrics(
    emp.salary,
    startDate,
    endDate,
    payrollCountry,
    expectedPeriodHours,
    customHolidays
  );
  const calc = computePayFromSalary(
    emp.salary,
    summary.regularHours,
    summary.extraHours,
    summary.weekendHours,
    expectedPeriodHours,
    holidayMeta.holidayHours
  );

  return sendSuccess(res, {
    employee: {
      id: emp.id,
      empId: emp.EMPID,
      employeeName: emp.employeeName,
      baseSalary: parseFloat(emp.salary) || 0,
    },
    period: { startDate, endDate },
    periodCalendar: enrichPeriodCalendarDays(
      buildPeriodCalendar(startDate, endDate),
      payrollCountry,
      customHolidays
    ),
    payrollCountry,
    requiredHours: expectedPeriodHours,
    loggedHours: Number(summary.regularHours) || 0,
    missingHours: Number(
      Math.max(0, expectedPeriodHours - (Number(summary.regularHours) || 0)).toFixed(2)
    ),
    governmentHolidays: holidayMeta.allHolidays,
    payableHolidays: holidayMeta.holidays,
    ...summary,
    ...calc,
  });
});

/** Employee: list own payslips with status = paid (download by month). */
export const listMyPaidPayslips = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const requesterPk = await resolveRequestingEmployeePk(q, req);
  if (requesterPk == null) {
    return sendError(res, "Employee login required", 403);
  }

  await ensurePayslipTable(q);

  const rows = await q(
    `SELECT id, employee_id, period_start, period_end, final_amount, attendance_pay, status, updated_at
     FROM employee_payslips
     WHERE employee_id = ? AND LOWER(TRIM(COALESCE(status, ''))) = 'paid'
     ORDER BY period_start DESC`,
    [requesterPk]
  );

  const empRows = await q(
    "SELECT id, EMPID, employeeName, designation FROM employee WHERE id = ? LIMIT 1",
    [requesterPk]
  );
  const emp = empRows[0] || {};

  const list = rows.map((r) => ({
    payslipId: r.id,
    employeeId: r.employee_id,
    empId: emp.EMPID,
    employeeName: emp.employeeName,
    designation: emp.designation,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    periodMonth: String(r.period_start).slice(0, 7),
    periodLabel: formatPeriodLabel(r.period_start),
    finalAmount: parseFloat(r.final_amount) || 0,
    attendancePay: parseFloat(r.attendance_pay) || 0,
    status: normalizePayslipStatus(r.status),
    updatedAt: r.updated_at,
  }));

  return sendSuccess(res, list);
});

/** Employee: own attendance + pay breakdown for a period (read-only, same metrics as admin grid). */
export const getMyPayslipPeriodSummary = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const workQ = getWorkDetailsQuery(req);
  const requesterPk = await resolveRequestingEmployeePk(q, req);
  if (requesterPk == null) {
    return sendError(res, "Employee login required", 403);
  }

  const range = parseDateRange(req.query.startDate, req.query.endDate);
  if (!range) {
    return sendError(res, "startDate and endDate are required", 400);
  }

  const { startDate, endDate } = range;
  await ensurePayslipTable(q);

  const empRows = await q(
    `SELECT id, EMPID, employeeName, designation, salary, userName, employeeStatus
     FROM employee WHERE id = ? LIMIT 1`,
    [requesterPk]
  );
  if (!empRows.length) {
    return sendError(res, "Employee not found", 404);
  }

  const emp = empRows[0];
  const { country: payrollCountry, customHolidays } = await fetchPayrollHolidaySettings(q);
  const expectedPeriodHours = computeExpectedPeriodHours(
    startDate,
    endDate,
    payrollCountry,
    customHolidays
  );

  const summary = await fetchAttendanceHours(workQ, emp.userName, startDate, endDate);
  const baseSalary = parseFloat(emp.salary) || 0;
  const holidayMeta = computeHolidayPayMetrics(
    baseSalary,
    startDate,
    endDate,
    payrollCountry,
    expectedPeriodHours,
    customHolidays
  );
  const calc = computePayFromSalary(
    baseSalary,
    summary.regularHours,
    summary.extraHours,
    summary.weekendHours,
    expectedPeriodHours,
    holidayMeta.holidayHours
  );

  const savedRows = await q(
    "SELECT * FROM employee_payslips WHERE employee_id = ? AND period_start = ? AND period_end = ? LIMIT 1",
    [emp.id, startDate, endDate]
  );
  const saved = savedRows[0];
  const adjustments = saved ? parseFloat(saved.adjustments) || 0 : 0;
  const monthPayable = calc.monthPayable;
  let finalAmount = Number((monthPayable + adjustments).toFixed(2));
  if (saved && saved.final_amount != null) {
    const savedFinal = parseFloat(saved.final_amount);
    if (!Number.isNaN(savedFinal)) {
      const looksLikeProfileOnly =
        Math.abs(savedFinal - baseSalary) < 1 && Math.abs(savedFinal - monthPayable) > 1;
      if (!looksLikeProfileOnly) finalAmount = savedFinal;
    }
  }

  const requiredHours = expectedPeriodHours;
  const loggedHours = Number(summary.regularHours) || 0;
  const missingHours = Number(Math.max(0, requiredHours - loggedHours).toFixed(2));

  const employee = {
    employeeId: emp.id,
    empId: emp.EMPID,
    employeeName: emp.employeeName,
    designation: emp.designation,
    totalSalary: baseSalary,
    baseSalary,
    monthPayable,
    checkInCount: summary.checkInCount,
    checkOutCount: summary.checkOutCount,
    totalHours: saved ? parseFloat(saved.total_hours) : summary.totalHours,
    regularHours: summary.regularHours,
    extraHours: summary.extraHours,
    weekendHours: summary.weekendHours,
    requiredHours,
    loggedHours,
    missingHours,
    holidayCount: holidayMeta.holidayCount,
    regularPay: calc.regularPay,
    extraPay: calc.extraPay,
    weekendPay: calc.weekendPay,
    holidayHours: calc.holidayHours,
    holidayPay: calc.holidayPay,
    attendancePay: saved ? parseFloat(saved.attendance_pay) : calc.attendancePay,
    adjustments,
    finalAmount,
    status: saved?.status || "draft",
    payslipId: saved?.id || null,
    period: { startDate, endDate },
    canDownload: saved ? normalizePayslipStatus(saved.status) === "paid" : false,
  };

  const periodCalendar = enrichPeriodCalendarDays(
    buildPeriodCalendar(startDate, endDate),
    payrollCountry,
    customHolidays
  );
  const workingDaysInPeriod = periodCalendar.filter((d) => d.isWorkingDay).length;
  const periodHolidayMeta = computeHolidayPayMetrics(
    0,
    startDate,
    endDate,
    payrollCountry,
    expectedPeriodHours,
    customHolidays
  );

  return sendSuccess(res, {
    employee,
    periodCalendar,
    periodSummary: {
      requiredHours: expectedPeriodHours,
      workingDaysInPeriod,
      holidayCount: periodHolidayMeta.holidayCount,
      holidayHours: periodHolidayMeta.holidayHours,
      governmentHolidays: periodHolidayMeta.allHolidays,
      payrollCountry,
    },
  });
});

export const upsertSalaryPayslip = asyncHandler(async (req, res) => {
  if (!isPayrollAdmin(req)) {
    return sendError(res, "Insufficient permissions", 403);
  }
  const q = getTenantQuery(req);
  const {
    employeeId,
    startDate,
    endDate,
    adjustments,
    attendancePay,
    totalHours,
    notes,
    status,
    recalculateFromAttendance,
    payslipDetail,
  } = req.body;

  if (!employeeId || !startDate || !endDate) {
    return sendError(res, "employeeId, startDate, and endDate are required", 400);
  }

  await ensurePayslipTable(q);

  const empRows = await q(
    "SELECT id, salary, userName FROM employee WHERE id = ? OR EMPID = ? LIMIT 1",
    [employeeId, employeeId]
  );
  if (!empRows.length) {
    return sendError(res, "Employee not found", 404);
  }

  const emp = empRows[0];
  const { country: payrollCountry, customHolidays } = await fetchPayrollHolidaySettings(q);
  const expectedPeriodHours = computeExpectedPeriodHours(
    startDate,
    endDate,
    payrollCountry,
    customHolidays
  );
  const holidayMeta = computeHolidayPayMetrics(
    emp.salary,
    startDate,
    endDate,
    payrollCountry,
    expectedPeriodHours,
    customHolidays
  );
  let hours = parseFloat(totalHours);
  let payCalc;

  if (recalculateFromAttendance || Number.isNaN(hours)) {
    const workQ = getWorkDetailsQuery(req);
    const summary = await fetchAttendanceHours(workQ, emp.userName, startDate, endDate);
    hours = summary.totalHours;
    payCalc = computePayFromSalary(
      emp.salary,
      summary.regularHours,
      summary.extraHours,
      summary.weekendHours,
      expectedPeriodHours,
      holidayMeta.holidayHours
    );
  } else {
    payCalc = computePayFromSalary(
      emp.salary,
      hours,
      0,
      0,
      expectedPeriodHours,
      holidayMeta.holidayHours
    );
  }

  const baseSalary = parseFloat(emp.salary) || 0;
  const adj = parseFloat(adjustments) || 0;
  const attPay =
    attendancePay !== undefined && attendancePay !== null
      ? parseFloat(attendancePay)
      : payCalc.monthPayable;
  const finalAmount = Number((payCalc.monthPayable + adj).toFixed(2));
  const payslipStatus = status || "draft";
  const updatedBy = req.userId || req.employeeId || null;
  let detailJson = null;
  if (payslipDetail != null) {
    detailJson =
      typeof payslipDetail === "string" ? payslipDetail : JSON.stringify(payslipDetail);
  }

  const existing = await q(
    "SELECT id FROM employee_payslips WHERE employee_id = ? AND period_start = ? AND period_end = ? LIMIT 1",
    [emp.id, startDate, endDate]
  );

  if (existing.length) {
    await q(
      `UPDATE employee_payslips SET
        base_salary = ?, total_hours = ?, expected_hours = ?, hourly_rate = ?,
        attendance_pay = ?, adjustments = ?, final_amount = ?, status = ?, notes = ?,
        payslip_detail = COALESCE(?, payslip_detail), updated_by = ?
      WHERE id = ?`,
      [
        baseSalary,
        hours,
        payCalc.expectedHours,
        payCalc.hourlyRate,
        attPay,
        adj,
        finalAmount,
        payslipStatus,
        notes || null,
        detailJson,
        updatedBy,
        existing[0].id,
      ]
    );
    const updated = await q("SELECT * FROM employee_payslips WHERE id = ?", [existing[0].id]);
    return sendSuccess(res, updated[0], "Payslip updated");
  }

  const insertResult = await q(
    `INSERT INTO employee_payslips (
      employee_id, period_start, period_end, base_salary, total_hours, expected_hours,
      hourly_rate, attendance_pay, adjustments, final_amount, status, notes, payslip_detail, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      emp.id,
      startDate,
      endDate,
      baseSalary,
      hours,
      payCalc.expectedHours,
      payCalc.hourlyRate,
      attPay,
      adj,
      finalAmount,
      payslipStatus,
      notes || null,
      detailJson,
      updatedBy,
    ]
  );

  const created = await q("SELECT * FROM employee_payslips WHERE id = ?", [insertResult.insertId]);
  return sendSuccess(res, created[0], "Payslip saved");
});
