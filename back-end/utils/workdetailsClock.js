/**
 * Shared check-in / check-out fields from workdetails for APIs and payroll.
 */

import { getTenantQuery, query as primaryQuery } from "../config/database.js";

export const WORKDETAILS_CLOCK_SQL = `
  DATE_FORMAT(wd.clockInTime, '%Y-%m-%d %H:%i:%s') AS clockInTimeRaw,
  DATE_FORMAT(wd.clockOutTime, '%Y-%m-%d %H:%i:%s') AS clockOutTimeRaw,
  DATE_FORMAT(wd.approvedDate, '%Y-%m-%d %H:%i:%s') AS approvedDateRaw
`;

/** When clockInTime/clockOutTime columns are missing on workdetails. */
export const WORKDETAILS_CLOCK_SQL_FALLBACK = `
  wd.sentDate AS clockInTimeRaw,
  wd.approvedDate AS clockOutTimeRaw,
  wd.approvedDate AS approvedDateRaw
`;

function isMissingColumnError(err) {
  return err?.code === "ER_BAD_FIELD_ERROR" || /Unknown column/i.test(String(err?.message || ""));
}

async function queryWorkDetailsRows(q, sqlWithClock, sqlFallback, params) {
  try {
    return await q(sqlWithClock, params);
  } catch (err) {
    if (!isMissingColumnError(err)) throw err;
    return q(sqlFallback, params);
  }
}

export function hoursFromWorkRow(row) {
  if (!row) return 0;
  const total = parseFloat(row.totalHours ?? row.totalhours);
  if (!Number.isNaN(total) && total > 0) return total;

  const inRaw = row.clockInTimeRaw || row.clockInTime;
  const outRaw = row.clockOutTimeRaw || row.clockOutTime;
  if (!inRaw || !outRaw) return 0;

  const clockIn = new Date(inRaw);
  const clockOut = new Date(outRaw);
  if (Number.isNaN(clockIn.getTime()) || Number.isNaN(clockOut.getTime())) return 0;

  const diffMs = clockOut.getTime() - clockIn.getTime();
  if (diffMs <= 0) return 0;
  return diffMs / (1000 * 60 * 60);
}

/** Normalize a workdetails row with string clock times and calculated hours. */
export function mapWorkDetailRow(row) {
  if (!row) return null;
  const calculatedHours = hoursFromWorkRow(row);
  const totalHours = parseFloat(row.totalHours ?? row.totalhours);
  const resolvedTotal =
    !Number.isNaN(totalHours) && totalHours > 0 ? totalHours : calculatedHours;

  return {
    ...row,
    clockInTime: row.clockInTimeRaw || row.clockInTime || row.sentDate || null,
    clockOutTime: row.clockOutTimeRaw || row.clockOutTime || row.approvedDate || null,
    approvedDate: row.approvedDateRaw || row.approvedDate || null,
    totalHours: resolvedTotal,
    calculatedHours: Number(calculatedHours.toFixed(2)),
    hasClockIn: Boolean(row.clockInTimeRaw || row.clockInTime),
    hasClockOut: Boolean(row.clockOutTimeRaw || row.clockOutTime),
  };
}

export function mapWorkDetailRows(rows) {
  return (rows || []).map((r) => mapWorkDetailRow(r)).filter(Boolean);
}

/** Fetch workdetails by ids and return Map<id, mapped row>. */
export async function fetchWorkDetailsByIds(q, ids) {
  const uniqueIds = [...new Set((ids || []).map((id) => Number(id)).filter((id) => id > 0))];
  if (!uniqueIds.length) return new Map();

  const placeholders = uniqueIds.map(() => "?").join(",");
  const sqlWithClock = `
    SELECT wd.*, ${WORKDETAILS_CLOCK_SQL}
    FROM workdetails wd
    WHERE wd.id IN (${placeholders})
  `;
  const sqlFallback = `
    SELECT wd.*, ${WORKDETAILS_CLOCK_SQL_FALLBACK}
    FROM workdetails wd
    WHERE wd.id IN (${placeholders})
  `;
  const rows = await queryWorkDetailsRows(q, sqlWithClock, sqlFallback, uniqueIds);
  const map = new Map();
  mapWorkDetailRows(rows).forEach((row) => {
    map.set(Number(row.id), row);
  });
  return map;
}

export function attachWorkDetailToRecord(record, workDetail) {
  if (!workDetail) return record;
  return {
    ...record,
    workDetail,
    clockInTime: workDetail.clockInTime,
    clockOutTime: workDetail.clockOutTime,
    totalHours: workDetail.totalHours,
    calculatedHours: workDetail.calculatedHours,
    workDate: workDetail.sentDate,
    workStatus: workDetail.status,
    referenceNo: workDetail.referenceNo,
    areaOfWork: workDetail.areaofWork || workDetail.areaOfWork,
    variation: workDetail.variation,
    taskNo: workDetail.taskNo,
  };
}

/**
 * Load workdetails by id from the tenant DB (company DB for company logins).
 * Super-admin logins may fall back to primary only when a row is missing on tenant.
 */
export async function fetchWorkDetailsByIdsForRequest(req, ids) {
  const tenantQ = getTenantQuery(req);
  const map = await fetchWorkDetailsByIds(tenantQ, ids);

  if (isCompanyUserReq(req)) return map;

  const missing = [...new Set((ids || []).map((id) => Number(id)).filter((id) => id > 0))].filter(
    (id) => !map.has(id)
  );
  if (!missing.length) return map;

  const primaryMap = await fetchWorkDetailsByIds(primaryQuery, missing);
  primaryMap.forEach((value, key) => {
    if (!map.has(key)) map.set(key, value);
  });
  return map;
}

/** Query fn for workdetails: company DB when company user is logged in. */
export function getWorkDetailsQuery(req) {
  return getTenantQuery(req);
}

function isCompanyUserReq(req) {
  return (
    req?.isCompanyUser === true ||
    (req?.company_id != null && String(req.company_id).trim() !== "") ||
    (req?.company_user_id != null && String(req.company_user_id).trim() !== "")
  );
}

/** Entity IDs already approved (approval_history + workdetails.status on tenant DB only). */
export async function fetchApprovedTimesheetEntityIds(req) {
  const ids = new Set();
  const historySql = `
    SELECT DISTINCT entity_id
    FROM approval_history
    WHERE LOWER(TRIM(COALESCE(status, ''))) = 'approved'
      AND LOWER(TRIM(entity_type)) IN ('timesheet', 'workdetails')
  `;

  const loadHistory = async (q, label) => {
    try {
      const rows = await q(historySql, []);
      for (const r of rows || []) {
        const id = Number(r.entity_id);
        if (id > 0) ids.add(id);
      }
    } catch (e) {
      if (e?.code === "ER_NO_SUCH_TABLE") return;
      console.warn(`[workdetails] approved entity ids (${label}):`, e.message);
    }
  };

  const workQ = getWorkDetailsQuery(req);
  const wdSql = `
    SELECT DISTINCT wd.id AS entity_id
    FROM workdetails wd
    WHERE LOWER(TRIM(COALESCE(wd.status, ''))) = 'approved'
       OR (wd.approvedDate IS NOT NULL AND wd.approvedDate != '0000-00-00 00:00:00')
  `;

  await loadHistory(getTenantQuery(req), "tenant");
  if (!isCompanyUserReq(req)) await loadHistory(primaryQuery, "primary");

  try {
    const wdRows = await workQ(wdSql, []);
    for (const r of wdRows || []) {
      const id = Number(r.entity_id);
      if (id > 0) ids.add(id);
    }
  } catch (e) {
    if (e?.code !== "ER_BAD_FIELD_ERROR") {
      try {
        const wdRows = await workQ(
          `SELECT DISTINCT wd.id AS entity_id FROM workdetails wd WHERE LOWER(TRIM(COALESCE(wd.status, ''))) = 'approved'`,
          []
        );
        for (const r of wdRows || []) {
          const id = Number(r.entity_id);
          if (id > 0) ids.add(id);
        }
      } catch (e2) {
        console.warn("[workdetails] approved ids from workdetails:", e2.message);
      }
    }
  }

  return ids;
}

/** Approved workdetails rows for History when workdetails.status was updated but history row is missing. */
export async function fetchApprovedWorkDetailsForHistory(req) {
  const tenantQ = getWorkDetailsQuery(req);
  const baseFrom = `
    FROM workdetails wd
    LEFT JOIN employee e ON wd.userName = e.userName
  `;
  const whereApproved = `
    WHERE (
      LOWER(TRIM(COALESCE(wd.status, ''))) = 'approved'
      OR (wd.approvedDate IS NOT NULL AND wd.approvedDate != '0000-00-00 00:00:00')
    )
  `;
  const selectTail = `
    ${baseFrom}
    ${whereApproved}
    ORDER BY wd.approvedDate DESC, wd.sentDate DESC, wd.id DESC
  `;
  const sqlWithClock = `
    SELECT wd.*, ${WORKDETAILS_CLOCK_SQL},
           COALESCE(e.employeeName, wd.employeeName) AS employeeName,
           e.EMPID
    ${selectTail}
  `;
  const sqlFallback = `
    SELECT wd.*, ${WORKDETAILS_CLOCK_SQL_FALLBACK},
           COALESCE(e.employeeName, wd.employeeName) AS employeeName,
           e.EMPID
    ${selectTail}
  `;

  let rows;
  try {
    rows = await queryWorkDetailsRows(tenantQ, sqlWithClock, sqlFallback, []);
  } catch (err) {
    if (!isMissingColumnError(err)) throw err;
    const whereStatusOnly = `
      WHERE LOWER(TRIM(COALESCE(wd.status, ''))) = 'approved'
    `;
    const sqlNoDate = sqlWithClock.replace(whereApproved, whereStatusOnly);
    const sqlNoDateFb = sqlFallback.replace(whereApproved, whereStatusOnly);
    rows = await queryWorkDetailsRows(tenantQ, sqlNoDate, sqlNoDateFb, []);
  }

  return mapWorkDetailRows(rows);
}

/** Only rows still awaiting approval (not approved/rejected, no approval date). */
const PENDING_WORKDETAILS_WHERE = `
  WHERE LOWER(TRIM(COALESCE(wd.status, ''))) NOT IN ('approved', 'rejected')
    AND (wd.approvedDate IS NULL OR wd.approvedDate = '0000-00-00 00:00:00')
`;

const PENDING_WORKDETAILS_WHERE_NO_APPROVED_DATE = `
  WHERE LOWER(TRIM(COALESCE(wd.status, ''))) NOT IN ('approved', 'rejected')
`;

/** Pending workdetails for Approval Center (tenant / company DB only). */
export async function fetchPendingWorkDetailsForRequest(req) {
  const approvedIds = await fetchApprovedTimesheetEntityIds(req);
  const tenantQ = getWorkDetailsQuery(req);
  const baseFrom = `
    FROM workdetails wd
    LEFT JOIN employee e ON wd.userName = e.userName
  `;
  const selectTail = `
    ${baseFrom}
    ${PENDING_WORKDETAILS_WHERE}
    ORDER BY wd.sentDate DESC, wd.id DESC
  `;
  const sqlWithClock = `
    SELECT wd.*, ${WORKDETAILS_CLOCK_SQL},
           COALESCE(e.employeeName, wd.employeeName) AS employeeName,
           e.EMPID
    ${selectTail}
  `;
  const sqlFallback = `
    SELECT wd.*, ${WORKDETAILS_CLOCK_SQL_FALLBACK},
           COALESCE(e.employeeName, wd.employeeName) AS employeeName,
           e.EMPID
    ${selectTail}
  `;

  let rows;
  try {
    rows = await queryWorkDetailsRows(tenantQ, sqlWithClock, sqlFallback, []);
  } catch (err) {
    if (!isMissingColumnError(err)) throw err;
    const sqlNoDate = sqlWithClock.replace(PENDING_WORKDETAILS_WHERE, PENDING_WORKDETAILS_WHERE_NO_APPROVED_DATE);
    const sqlNoDateFb = sqlFallback.replace(PENDING_WORKDETAILS_WHERE, PENDING_WORKDETAILS_WHERE_NO_APPROVED_DATE);
    rows = await queryWorkDetailsRows(tenantQ, sqlNoDate, sqlNoDateFb, []);
  }

  const pending = filterPendingWorkdetailRows(rows).filter(
    (r) => !approvedIds.has(Number(r.id))
  );
  return mapWorkDetailRows(pending);
}

function filterPendingWorkdetailRows(rows) {
  return (rows || []).filter((r) => {
    const s = String(r.status || "").toLowerCase().trim();
    if (s === "approved" || s === "rejected") return false;
    const ad = r.approvedDate || r.approvedDateRaw;
    if (ad && String(ad) !== "0000-00-00 00:00:00") return false;
    return true;
  });
}
