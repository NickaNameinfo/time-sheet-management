/**
 * Display / form value for employee EMPID.
 * Supports numeric IDs and alphanumeric (e.g. NN001). Falls back to DB `id` when EMPID is empty or numeric 0.
 */
export function getDisplayEmployeeId(row) {
  if (!row) return "";
  const v = row.EMPID;
  if (v == null || v === "") return row.id != null ? String(row.id) : "";
  const s = String(v).trim();
  if (s === "") return row.id != null ? String(row.id) : "";
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    return Number.isNaN(n) || n <= 0 ? String(row.id ?? "") : s;
  }
  return s;
}
