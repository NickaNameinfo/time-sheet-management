/**
 * Employee status filters — company DB uses Permanent, Probation, etc., not only "Active".
 */

const INACTIVE_STATUS_KEYS = new Set([
  "ex-employee",
  "ex employee",
  "relieved",
  "inactive",
  "terminated",
  "resigned",
  "left",
  "deleted",
  "dismissed",
]);

export function isActiveEmployeeStatus(status) {
  const s = String(status ?? "")
    .trim()
    .toLowerCase();
  if (!s) return true;
  return !INACTIVE_STATUS_KEYS.has(s);
}

/** SQL fragment: AND (...exclude inactive statuses...) */
export function sqlActiveEmployeesOnly(columnRef = "employeeStatus") {
  const inactiveList = [...INACTIVE_STATUS_KEYS]
    .map((s) => `'${s.replace(/'/g, "''")}'`)
    .join(", ");
  return ` AND (
    ${columnRef} IS NULL
    OR TRIM(${columnRef}) = ''
    OR LOWER(TRIM(${columnRef})) NOT IN (${inactiveList})
  )`;
}
