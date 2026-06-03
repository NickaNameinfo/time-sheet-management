import { workDetailHours } from "./formatWorkDetailClock";

export const STANDARD_DAILY_HOURS = 8;

export function entryWorkDate(row) {
  const raw = row?.clockInTime || row?.sentDate;
  if (!raw) return null;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const s = String(raw).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

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

export function eachDateInRange(startDate, endDate) {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const cur = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const days = [];
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

/** Working weekdays in period × 8h (weekends excluded; matches payroll base before govt holidays). */
export function computeRequiredPeriodHours(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  let workingDays = 0;
  for (const date of eachDateInRange(startDate, endDate)) {
    if (!isWeekendDate(date)) workingDays += 1;
  }
  return Number((workingDays * STANDARD_DAILY_HOURS).toFixed(2));
}

export function mapRowToAttendanceEntry(row) {
  const clockIn = row?.clockInTime || row?.sentDate;
  const clockOut = row?.clockOutTime || row?.approvedDate;
  return {
    ...row,
    clockInTime: clockIn,
    clockOutTime: clockOut,
    sentDate: row?.sentDate,
    calculatedHours: workDetailHours(row),
    totalHours: workDetailHours(row),
    hasClockIn: Boolean(clockIn),
    hasClockOut: Boolean(clockOut),
  };
}

/**
 * Weekdays: first 8h = regular, above 8h = extra. Sat/Sun: all hours = weekend.
 * Same rules as payroll (payslipController.summarizeAttendance).
 */
export function summarizeAttendance(entries) {
  const list = (entries || []).map((e) =>
    typeof e.calculatedHours === "number" ? e : mapRowToAttendanceEntry(e)
  );

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

  return {
    checkInCount,
    checkOutCount,
    totalHours,
    regularHours,
    extraHours,
    weekendHours,
    dailyBreakdown,
    workingDaysInPeriod: dailyBreakdown.filter((d) => !d.isWeekend).length,
  };
}

export function summarizeByEmployee(rows, periodStart, periodEnd) {
  const requiredHours = computeRequiredPeriodHours(periodStart, periodEnd);
  const groups = new Map();

  for (const row of rows || []) {
    const key = row.userName || row.employeeName || "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  return [...groups.entries()]
    .map(([key, empRows]) => {
      const summary = summarizeAttendance(empRows);
      const loggedHours = summary.regularHours;
      const missingHours = Number(Math.max(0, requiredHours - loggedHours).toFixed(2));
      return {
        key,
        employeeName: empRows[0]?.employeeName || key,
        userName: empRows[0]?.userName || key,
        requiredHours,
        loggedHours,
        missingHours,
        ...summary,
      };
    })
    .sort((a, b) => String(a.employeeName).localeCompare(String(b.employeeName)));
}

export function summarizeTeam(rows, periodStart, periodEnd) {
  const employeeSummaries = summarizeByEmployee(rows, periodStart, periodEnd);
  const requiredHours = computeRequiredPeriodHours(periodStart, periodEnd);
  const teamSummary = summarizeAttendance(rows);

  const totals = employeeSummaries.reduce(
    (acc, e) => ({
      requiredHours: acc.requiredHours + e.requiredHours,
      loggedHours: acc.loggedHours + e.loggedHours,
      missingHours: acc.missingHours + e.missingHours,
      regularHours: acc.regularHours + e.regularHours,
      extraHours: acc.extraHours + e.extraHours,
      weekendHours: acc.weekendHours + e.weekendHours,
      checkInCount: acc.checkInCount + e.checkInCount,
      checkOutCount: acc.checkOutCount + e.checkOutCount,
    }),
    {
      requiredHours: 0,
      loggedHours: 0,
      missingHours: 0,
      regularHours: 0,
      extraHours: 0,
      weekendHours: 0,
      checkInCount: 0,
      checkOutCount: 0,
    }
  );

  return {
    periodStart,
    periodEnd,
    requiredHoursPerEmployee: requiredHours,
    employeeCount: employeeSummaries.length,
    employeeSummaries,
    teamClockSummary: teamSummary,
    totals,
    weekdaysInPeriod: eachDateInRange(periodStart, periodEnd).filter((d) => !isWeekendDate(d))
      .length,
  };
}

/** Attach per-row day bucket hours for grid display. */
export function enrichRowsWithDayMetrics(rows) {
  const summary = summarizeAttendance(rows);
  const dayMap = new Map(summary.dailyBreakdown.map((d) => [d.date, d]));

  return (rows || []).map((row) => {
    const day = entryWorkDate(row);
    const dayInfo = day ? dayMap.get(day) : null;
    const entryHours = workDetailHours(row);
    return {
      ...row,
      workDate: day,
      dayOfWeek: day ? dayOfWeekLabel(day) : "",
      entryHours: Number(entryHours.toFixed(2)),
      dayTotalHours: dayInfo?.dayTotalHours ?? null,
      dayRegularHours: dayInfo?.regularHours ?? null,
      dayExtraHours: dayInfo?.extraHours ?? null,
      dayWeekendHours: dayInfo?.weekendHours ?? null,
      isWeekendDay: dayInfo?.isWeekend ?? (day ? isWeekendDate(day) : false),
    };
  });
}
