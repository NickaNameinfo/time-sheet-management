import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Get Approval Workflows
export const getApprovalWorkflows = asyncHandler(async (req, res) => {
  const { entityType, isActive } = req.query;
  let sql = "SELECT * FROM approval_workflows WHERE 1=1";
  const params = [];

  if (entityType) {
    sql += " AND entity_type = ?";
    params.push(entityType);
  }
  if (isActive !== undefined) {
    sql += " AND is_active = ?";
    params.push(isActive === "true" ? 1 : 0);
  }

  sql += " ORDER BY entity_type, name";

  const results = await query(sql, params);
  return sendSuccess(res, results);
});

// Create Approval Workflow
export const createApprovalWorkflow = asyncHandler(async (req, res) => {
  const { name, entityType, approvalLevels } = req.body;

  if (!name || !entityType || !approvalLevels) {
    return sendError(res, "name, entityType, and approvalLevels are required", 400);
  }

  const insertSql = `
    INSERT INTO approval_workflows (name, entity_type, approval_levels)
    VALUES (?, ?, ?)
  `;
  await query(insertSql, [name, entityType, JSON.stringify(approvalLevels)]);

  return sendSuccess(res, null, "Approval workflow created successfully");
});

// Approve/Reject Entity
export const approveEntity = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { approverId, status, comments, approvalLevel } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return sendError(res, "Status must be 'approved' or 'rejected'", 400);
  }

  if (!approverId) {
    return sendError(res, "approverId is required", 400);
  }

  // Get workflow (optional - if no workflow exists, proceed without multi-level approval)
  const workflowSql = "SELECT * FROM approval_workflows WHERE entity_type = ? AND is_active = TRUE LIMIT 1";
  const workflows = await query(workflowSql, [entityType]);
  const workflow = workflows[0];

  let currentLevel = approvalLevel || 1;
  let approvalLevels = [];
  let allApproved = true;

  if (workflow) {
    approvalLevels = JSON.parse(workflow.approval_levels);
    currentLevel = approvalLevel || 1;

    // Add to approval history
    try {
      const historySql = `
        INSERT INTO approval_history (entity_type, entity_id, approver_id, approval_level, status, comments)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await query(historySql, [entityType, entityId, approverId, currentLevel, status, comments || ""]);
    } catch (error) {
      // If approval_history table doesn't exist, continue without it
      console.warn("Approval history table not found, skipping history entry:", error.message);
    }

    // Check if all levels approved
    try {
      const requiredLevels = approvalLevels.length;
      const approvedLevelsResult = await query(
        `SELECT COUNT(DISTINCT approval_level) as count 
         FROM approval_history 
         WHERE entity_type = ? AND entity_id = ? AND status = 'approved'`,
        [entityType, entityId]
      );
      allApproved = approvedLevelsResult[0].count >= requiredLevels;
    } catch (error) {
      // If approval_history table doesn't exist, assume single-level approval
      allApproved = true;
    }
  } else {
    // No workflow - single level approval, add to history if table exists
    try {
      const historySql = `
        INSERT INTO approval_history (entity_type, entity_id, approver_id, approval_level, status, comments)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await query(historySql, [entityType, entityId, approverId, 1, status, comments || ""]);
    } catch (error) {
      // If approval_history table doesn't exist, continue without it
      console.warn("Approval history table not found, skipping history entry:", error.message);
    }
  }

  // Update entity status based on type (with approverId)
  let updateSql = "";
  let updateParams = [];

  if (entityType === "leave") {
    // leavedetails table doesn't have approvedDate column, only leaveStatus and approverId
    updateSql = "UPDATE leavedetails SET leaveStatus = ?, approverId = ? WHERE id = ?";
    updateParams = [status, approverId, entityId];
  } else if (entityType === "overtime") {
    updateSql = `
      UPDATE ot_records SET 
        approval_status = ?, 
        approved_by = ?,
        approverId = ?,
        approved_at = NOW(),
        comments = ?
      WHERE id = ?
    `;
    updateParams = [status, approverId, approverId, comments || "", entityId];
  } else if (entityType === "timesheet" || entityType === "workdetails") {
    updateSql = "UPDATE workdetails SET status = ?, approverId = ? WHERE id = ?";
    updateParams = [status, approverId, entityId];
  } else if (entityType === "compoff") {
    updateSql = "UPDATE compoff SET leaveStatus = ?, approverId = ? WHERE id = ?";
    updateParams = [status, approverId, entityId];
  } else {
    return sendError(res, `Unsupported entity type: ${entityType}`, 400);
  }

  if (updateSql) {
    await query(updateSql, updateParams);
  } else {
    return sendError(res, `No update SQL for entity type: ${entityType}`, 400);
  }

  return sendSuccess(res, {
    status,
    approvalLevel: currentLevel,
    allApproved,
    message: workflow 
      ? (allApproved ? "Fully approved" : `Approved at level ${currentLevel}`)
      : `${status} successfully`,
  });
});

// Get Approval History
export const getApprovalHistory = asyncHandler(async (req, res) => {
  const { entityType, entityId, status, approverId, startDate, endDate } = req.query;

  let sql = `
    SELECT ah.*, e.employeeName, e.EMPID
    FROM approval_history ah
    LEFT JOIN employee e ON ah.approver_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (entityType) {
    sql += " AND ah.entity_type = ?";
    params.push(entityType);
  }
  if (entityId) {
    sql += " AND ah.entity_id = ?";
    params.push(entityId);
  }
  if (status) {
    sql += " AND ah.status = ?";
    params.push(status);
  }
  if (approverId) {
    sql += " AND ah.approver_id = ?";
    params.push(approverId);
  }
  if (startDate) {
    sql += " AND DATE(ah.created_at) >= ?";
    params.push(startDate);
  }
  if (endDate) {
    sql += " AND DATE(ah.created_at) <= ?";
    params.push(endDate);
  }

  sql += " ORDER BY ah.created_at DESC, ah.approval_level DESC";

  try {
    const results = await query(sql, params);
    return sendSuccess(res, results);
  } catch (error) {
    // If approval_history table doesn't exist, return empty array
    if (error.code === "ER_NO_SUCH_TABLE" || error.message.includes("doesn't exist")) {
      console.warn("Approval history table not found, returning empty array");
      return sendSuccess(res, []);
    }
    throw error;
  }
});

// Get Pending Approvals
export const getPendingApprovals = asyncHandler(async (req, res) => {
  const { approverId, entityType } = req.query;

  if (!approverId) {
    return sendError(res, "approverId is required", 400);
  }

  // Get approver role
  const approverSql = "SELECT role FROM employee WHERE id = ?";
  const approvers = await query(approverSql, [approverId]);
  if (approvers.length === 0) {
    return sendError(res, "Approver not found", 404);
  }
  const approverRole = approvers[0].role;

  const pendingApprovals = [];

  // Get pending leaves
  if (!entityType || entityType === "leave") {
    const leaveSql = `
      SELECT l.*, e.employeeName, e.EMPID
      FROM leavedetails l
      LEFT JOIN employee e ON l.employeeName = e.userName
      WHERE l.leaveStatus = 'pending'
      ORDER BY l.leaveFrom DESC
    `;
    const leaves = await query(leaveSql);
    leaves.forEach((leave) => {
      pendingApprovals.push({
        entityType: "leave",
        entityId: leave.id,
        entity: leave,
        requestedBy: leave.employeeName,
        requestedDate: leave.leaveFrom,
      });
    });
  }

  // Get pending OT
  if (!entityType || entityType === "overtime") {
    const otSql = `
      SELECT ot.*, e.employeeName, e.EMPID
      FROM ot_records ot
      LEFT JOIN employee e ON ot.employee_id = e.id
      WHERE ot.approval_status = 'pending'
      ORDER BY ot.attendance_date DESC
    `;
    const otRecords = await query(otSql);
    otRecords.forEach((ot) => {
      pendingApprovals.push({
        entityType: "overtime",
        entityId: ot.id,
        entity: ot,
        requestedBy: ot.employeeName,
        requestedDate: ot.attendance_date,
      });
    });
  }

  // Get pending timesheets
  if (!entityType || entityType === "timesheet") {
    const timesheetSql = `
      SELECT wd.*, e.employeeName, e.EMPID
      FROM workdetails wd
      LEFT JOIN employee e ON wd.userName = e.userName
      WHERE wd.status = 'pending'
      ORDER BY wd.sentDate DESC
    `;
    const timesheets = await query(timesheetSql);
    timesheets.forEach((ts) => {
      pendingApprovals.push({
        entityType: "timesheet",
        entityId: ts.id,
        entity: ts,
        requestedBy: ts.employeeName,
        requestedDate: ts.sentDate,
      });
    });
  }

  return sendSuccess(res, pendingApprovals);
});

// Bulk Approve
export const bulkApprove = asyncHandler(async (req, res) => {
  const { entityType, entityIds, approverId, comments } = req.body;

  if (!Array.isArray(entityIds) || entityIds.length === 0) {
    return sendError(res, "entityIds array is required", 400);
  }

  const results = [];

  for (const entityId of entityIds) {
    try {
      const result = await approveEntity(
        { params: { entityType, entityId } },
        { body: { approverId, status: "approved", comments } },
        () => {}
      );
      results.push({ entityId, status: "approved" });
    } catch (error) {
      results.push({ entityId, status: "error", error: error.message });
    }
  }

  return sendSuccess(res, results, `${results.length} entities processed`);
});

