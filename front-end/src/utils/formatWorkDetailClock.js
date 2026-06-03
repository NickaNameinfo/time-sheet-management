/** Format clock-in / clock-out from workdetails API rows. */
export function formatClockDateTime(value) {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const s = String(value).trim();
    return s.length > 19 ? s.slice(0, 19) : s || "—";
  }
  return d.toLocaleString();
}

export function workDetailHours(row) {
  if (!row) return 0;
  const h = parseFloat(row.calculatedHours ?? row.totalHours ?? row.totalhours);
  return Number.isFinite(h) ? h : 0;
}

export function isTimesheetEntityType(entityType) {
  const t = String(entityType || "").toLowerCase();
  return t === "timesheet" || t === "workdetails";
}

/** Read clock fields from approval history row or nested workDetail. */
export function clockFieldsFromHistory(history) {
  const wd = history?.workDetail || history;
  return {
    clockInTime: history?.clockInTime ?? wd?.clockInTime ?? wd?.sentDate,
    clockOutTime: history?.clockOutTime ?? wd?.clockOutTime,
    totalHours: history?.totalHours ?? wd?.totalHours ?? wd?.calculatedHours,
    sentDate: wd?.sentDate ?? history?.workDate,
    status: wd?.status ?? history?.workStatus,
  };
}
