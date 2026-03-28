import { getTenantQuery } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

async function resolveEmployeeByLogin(q, login) {
  const key = (login || "").toString().trim().toLowerCase();
  if (!key) return null;
  try {
    const rows = await q(
      "SELECT id, employeeName FROM employee WHERE LOWER(TRIM(employeeEmail)) = ? OR LOWER(TRIM(userName)) = ? LIMIT 1",
      [key, key]
    );
    return rows?.[0] || null;
  } catch (e) {
    if (e?.code === "ER_NO_SUCH_TABLE") return null;
    throw e;
  }
}

function normalizeLeaveTypeKey(leaveType) {
  const t = String(leaveType || "").trim().toLowerCase();
  if (t === "annual") return "annual";
  if (t === "casual") return "casual";
  if (t === "emergency") return "emergency";
  if (t === "sick") return "sick";
  if (t === "comp_off" || t === "comp off" || t === "comp-off") return "comp_off";
  return t;
}

function leaveYearFromDate(leaveFrom) {
  if (!leaveFrom) return new Date().getFullYear();
  const d = new Date(leaveFrom);
  if (Number.isNaN(d.getTime())) return new Date().getFullYear();
  return d.getFullYear();
}

async function applyLeaveBalanceDelta(q, { employeeId, leaveType, leaveHours, leaveFrom, mode }) {
  const employee_id = Number(employeeId);
  const usedHours = Number(leaveHours || 0);
  const leave_type = normalizeLeaveTypeKey(leaveType);
  const year = leaveYearFromDate(leaveFrom);

  if (!employee_id || !leave_type || !usedHours) return;

  const rows = await q(
    `SELECT id, balance, used
     FROM leave_balances
     WHERE employee_id = ? AND leave_type = ? AND year = ?
     LIMIT 1`,
    [employee_id, leave_type, year]
  );
  if (!rows?.length) {
    throw Object.assign(new Error("Leave balance not found for employee/year/type"), {
      statusCode: 400,
    });
  }

  const currentBalance = Number(rows[0].balance || 0);
  const currentUsed = Number(rows[0].used || 0);

  if (mode === "decrease") {
    if (currentBalance < usedHours) {
      throw Object.assign(
        new Error(
          `Insufficient ${leave_type.toUpperCase()} leave balance. Available: ${currentBalance}, Requested: ${usedHours}`
        ),
        { statusCode: 400 }
      );
    }
    await q(
      `UPDATE leave_balances
       SET balance = balance - ?, used = used + ?
       WHERE id = ?`,
      [usedHours, usedHours, rows[0].id]
    );
    return;
  }

  if (mode === "increase") {
    // Restore balance when approved leave gets canceled/rejected.
    const restoreUsed = Math.min(currentUsed, usedHours);
    await q(
      `UPDATE leave_balances
       SET balance = balance + ?, used = GREATEST(used - ?, 0)
       WHERE id = ?`,
      [usedHours, restoreUsed, rows[0].id]
    );
  }
}

export const applyLeave = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  let employeeId = req.body.employeeId ?? req.id ?? null;
  let employeeName = req.body.employeeName ?? req.employeeName ?? null;

  // Final fallback: resolve from employee table by req.id
  if ((employeeId == null || employeeName == null) && req.id) {
    try {
      const rows = await q("SELECT id, employeeName FROM employee WHERE id = ? LIMIT 1", [req.id]);
      if (rows?.length) {
        if (employeeId == null) employeeId = rows[0].id;
        if (employeeName == null) employeeName = rows[0].employeeName;
      }
    } catch (e) {
      if (e?.code !== "ER_NO_SUCH_TABLE") throw e;
    }
  }

  // Company logins may not have decoded.id/employeeName in JWT; resolve from employee by login email/username.
  if ((employeeId == null || employeeName == null) && req.userName) {
    const er = await resolveEmployeeByLogin(q, req.userName);
    if (er) {
      if (employeeId == null) employeeId = er.id;
      if (employeeName == null) employeeName = er.employeeName;
    }
  }

  const baseSql =
    "INSERT INTO leavedetails (`leaveType`,`leaveFrom`,`leaveTo`, `leaveHours`,`reason`, `employeeName`, `employeeId`";
  let sql = baseSql;
  const values = [
    req.body.leaveType,
    req.body.leaveFrom,
    req.body.leaveTo,
    req.body.leaveHours,
    req.body.reason,
    employeeName,
    employeeId,
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

  const result = await q(sql, [values]);
  return sendSuccess(res, result, "Leave applied successfully");
});

export const applyCompOff = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  let employeeId = req.body.employeeId ?? req.id ?? null;
  let employeeName = req.body.employeeName ?? req.employeeName ?? null;
  if ((employeeId == null || employeeName == null) && req.id) {
    try {
      const rows = await q("SELECT id, employeeName FROM employee WHERE id = ? LIMIT 1", [req.id]);
      if (rows?.length) {
        if (employeeId == null) employeeId = rows[0].id;
        if (employeeName == null) employeeName = rows[0].employeeName;
      }
    } catch (e) {
      if (e?.code !== "ER_NO_SUCH_TABLE") throw e;
    }
  }
  if ((employeeId == null || employeeName == null) && req.userName) {
    const er = await resolveEmployeeByLogin(q, req.userName);
    if (er) {
      if (employeeId == null) employeeId = er.id;
      if (employeeName == null) employeeName = er.employeeName;
    }
  }
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
    employeeName,
    employeeId,
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

  const result = await q(sql, [values]);
  return sendSuccess(res, result, "Compensatory off applied successfully");
});

export const getLeaveDetails = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { employeeId } = req.query;
  const effectiveEmployeeId = employeeId ?? req.id ?? null;
  
  // Prefer filling employeeName/employeeId from employee table when leave rows are missing them.
  // Note: legacy rows with NULL employeeId cannot be reliably attributed; those will remain unmatched.
  let sql = `
    SELECT
      ld.*,
      COALESCE(ld.employeeName, e.employeeName) AS employeeName,
      COALESCE(ld.employeeId, e.id) AS employeeId
    FROM leavedetails ld
    LEFT JOIN employee e
      ON e.id = ld.employeeId
    WHERE 1=1
  `;
  const params = [];
  
  if (effectiveEmployeeId) {
    sql += " AND employeeId = ?";
    params.push(effectiveEmployeeId);
  }
  
  sql += " ORDER BY leaveFrom DESC, id DESC";
  
  const results = await q(sql, params);
  return sendSuccess(res, results);
});

export const getCompOffDetails = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { employeeId } = req.query;
  const effectiveEmployeeId = employeeId ?? req.id ?? null;
  
  let sql = `
    SELECT
      c.*,
      COALESCE(c.employeeName, e.employeeName) AS employeeName,
      COALESCE(c.employeeId, e.id) AS employeeId
    FROM compoff c
    LEFT JOIN employee e
      ON e.id = c.employeeId
    WHERE 1=1
  `;
  const params = [];
  
  if (effectiveEmployeeId) {
    sql += " AND employeeId = ?";
    params.push(effectiveEmployeeId);
  }
  
  sql += " ORDER BY leaveFrom DESC, id DESC";
  
  const results = await q(sql, params);
  return sendSuccess(res, results);
});

export const updateLeave = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
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

  const existingRows = await q(
    "SELECT id, leaveStatus, leaveType, leaveHours, leaveFrom, employeeId FROM leavedetails WHERE id = ? LIMIT 1",
    [id]
  );
  if (!existingRows?.length) {
    return sendError(res, "Leave record not found", 404);
  }

  const existing = existingRows[0];
  const prevStatus = String(existing.leaveStatus || "").trim().toLowerCase();
  const nextStatus = String(leaveStatus || "").trim().toLowerCase();
  const wasApproved = prevStatus === "approved";
  const isApprovedNow = nextStatus === "approved";

  // Deduct on first approval only.
  if (!wasApproved && isApprovedNow) {
    await applyLeaveBalanceDelta(q, {
      employeeId: employeeId ?? existing.employeeId,
      leaveType: leaveType ?? existing.leaveType,
      leaveHours: leaveHours ?? existing.leaveHours,
      leaveFrom: leaveFrom ?? existing.leaveFrom,
      mode: "decrease",
    });
  }

  // Restore when moving away from approved (rejected/canceled/etc).
  if (wasApproved && !isApprovedNow) {
    await applyLeaveBalanceDelta(q, {
      employeeId: employeeId ?? existing.employeeId,
      leaveType: leaveType ?? existing.leaveType,
      leaveHours: leaveHours ?? existing.leaveHours,
      leaveFrom: leaveFrom ?? existing.leaveFrom,
      mode: "increase",
    });
  }

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

  await q(sql, values);
  return sendSuccess(res, null, "Leave updated successfully");
});

export const updateCompOff = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
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

  await q(sql, values);
  return sendSuccess(res, null, "Compensatory off updated successfully");
});

export const deleteLeave = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const sql = "DELETE FROM leavedetails WHERE id = ?";
  await q(sql, [id]);
  return sendSuccess(res, null, "Leave deleted successfully");
});

export const deleteCompOff = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const sql = "DELETE FROM compoff WHERE id = ?";
  await q(sql, [id]);
  return sendSuccess(res, null, "Compensatory off deleted successfully");
});

