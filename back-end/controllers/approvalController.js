import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { calculateProductivityForEmployee } from "./productivityController.js";

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

  // Always add to approval history (regardless of workflow)
  // This ensures all approvals are tracked, whether from ApprovalCenter or ProjectWorkDetails
  try {
    const historySql = `
      INSERT INTO approval_history (entity_type, entity_id, approver_id, approval_level, status, comments)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const historyLevel = workflow ? (approvalLevel || 1) : 1;
    const historyResult = await query(historySql, [
      entityType, 
      entityId, 
      approverId, 
      historyLevel, 
      status, 
      comments || ""
    ]);
    console.log(
      `✓ Approval history created: EntityType: ${entityType}, EntityId: ${entityId}, ` +
      `ApproverId: ${approverId}, Status: ${status}, Level: ${historyLevel}, Comments: ${comments || 'none'}`
    );
  } catch (error) {
    // Log error but don't fail the approval
    console.error("❌ Error creating approval history:", error);
    console.error("Error details:", error.message, error.code);
    console.error("Error stack:", error.stack);
    // Continue with approval even if history creation fails
  }

  if (workflow) {
    approvalLevels = JSON.parse(workflow.approval_levels);
    currentLevel = approvalLevel || 1;

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
    // No workflow - single level approval
    allApproved = true;
  }

  // Update entity status based on type (with approverId)
  let updateSql = "";
  let updateParams = [];
  let leaveDetails = null; // Store leave details for balance update

  if (entityType === "leave") {
    // Fetch leave details before updating (needed for balance reduction)
    if (status === "approved") {
      const leaveSql = "SELECT employeeId, leaveType, leaveHours, leaveFrom FROM leavedetails WHERE id = ?";
      const leaveResults = await query(leaveSql, [entityId]);
      if (leaveResults.length > 0) {
        leaveDetails = leaveResults[0];
      }
    }
    
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
    // Update workdetails with status, approverId, and approvedDate (if approved)
    if (status === "approved") {
      updateSql = "UPDATE workdetails SET status = ?, approverId = ?, approvedDate = NOW() WHERE id = ?";
      updateParams = [status, approverId, entityId];
      console.log(`Updating timesheet/workdetails ID ${entityId} - Status: ${status}, ApproverId: ${approverId}, Setting approvedDate`);
    } else {
      updateSql = "UPDATE workdetails SET status = ?, approverId = ? WHERE id = ?";
      updateParams = [status, approverId, entityId];
      console.log(`Updating timesheet/workdetails ID ${entityId} - Status: ${status}, ApproverId: ${approverId}`);
    }
  } else if (entityType === "compoff") {
    updateSql = "UPDATE compoff SET leaveStatus = ?, approverId = ? WHERE id = ?";
    updateParams = [status, approverId, entityId];
  } else {
    return sendError(res, `Unsupported entity type: ${entityType}`, 400);
  }

  if (updateSql) {
    const updateResult = await query(updateSql, updateParams);
    
    // Verify timesheet/workdetails update and trigger productivity calculation
    if (entityType === "timesheet" || entityType === "workdetails") {
      try {
        const verifySql = "SELECT id, status, approverId, approvedDate, employeeNo, userName, sentDate FROM workdetails WHERE id = ?";
        const verifyResult = await query(verifySql, [entityId]);
        if (verifyResult.length > 0) {
          const updated = verifyResult[0];
          console.log(
            `✓ Timesheet/workdetails updated: ID ${entityId}, ` +
            `Status: ${updated.status}, ApproverId: ${updated.approverId}, ` +
            `ApprovedDate: ${updated.approvedDate || 'NULL'}`
          );
          
          // If approved, automatically recalculate productivity metrics
          if (status === "approved" && updated.employeeNo) {
            try {
              // Extract date from sentDate (handle different formats)
              let workDate = null;
              if (updated.sentDate) {
                // Try to parse the date
                const dateStr = updated.sentDate.toString();
                if (dateStr.includes('T')) {
                  workDate = dateStr.split('T')[0];
                } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
                  workDate = dateStr.substring(0, 10);
                } else {
                  // Try to parse as date
                  const parsedDate = new Date(updated.sentDate);
                  if (!isNaN(parsedDate.getTime())) {
                    workDate = parsedDate.toISOString().split('T')[0];
                  }
                }
              }
              
              // If we couldn't extract date, use today's date
              if (!workDate) {
                workDate = new Date().toISOString().split('T')[0];
              }
              
              // Get employee ID from employeeNo or userName
              let employeeId = updated.employeeNo;
              if (!employeeId && updated.userName) {
                const empSql = "SELECT id, EMPID FROM employee WHERE userName = ? LIMIT 1";
                const empResult = await query(empSql, [updated.userName]);
                if (empResult.length > 0) {
                  employeeId = empResult[0].id || empResult[0].EMPID;
                }
              }
              
              if (employeeId) {
                console.log(`🔄 Recalculating productivity for employee ${employeeId} on date ${workDate}`);
                await calculateProductivityForEmployee(employeeId, workDate);
                console.log(`✓ Productivity metrics updated for employee ${employeeId} on ${workDate}`);
              } else {
                console.warn(`⚠ Could not determine employee ID for workdetail ${entityId}`);
              }
            } catch (prodError) {
              // Log error but don't fail the approval
              console.error(`❌ Error calculating productivity after approval:`, prodError);
              console.error(`Error details:`, prodError.message, prodError.stack);
            }
          }
        } else {
          console.error(`Failed to verify timesheet/workdetails update for ID ${entityId}`);
        }
      } catch (error) {
        console.error(`Error verifying timesheet/workdetails update:`, error);
      }
    }
  } else {
    return sendError(res, `No update SQL for entity type: ${entityType}`, 400);
  }

  // If leave is approved, reduce leave balance
  if (entityType === "leave" && status === "approved" && leaveDetails) {
    try {
      console.log("Processing leave balance reduction for leave ID:", entityId);
      console.log("Leave details:", JSON.stringify(leaveDetails, null, 2));
      
      const employeeId = parseInt(leaveDetails.employeeId);
      const rawLeaveType = (leaveDetails.leaveType || "").trim();
      const leaveType = rawLeaveType.toLowerCase();
      const leaveHours = parseFloat(leaveDetails.leaveHours) || 0;
      
      console.log(`Parsed values - EmployeeId: ${employeeId}, LeaveType: ${leaveType}, LeaveHours: ${leaveHours}`);
      
      // Get year from leaveFrom date or use current year
      let year = new Date().getFullYear();
      if (leaveDetails.leaveFrom) {
        const leaveDate = new Date(leaveDetails.leaveFrom);
        if (!isNaN(leaveDate.getTime())) {
          year = leaveDate.getFullYear();
        }
      }
      
      if (!employeeId || isNaN(employeeId)) {
        console.error(`Invalid employeeId: ${leaveDetails.employeeId}`);
        return; // Skip balance update if employeeId is invalid
      }
      
      if (!leaveType || leaveHours <= 0) {
        console.warn(`Invalid leave type or hours - Type: ${leaveType}, Hours: ${leaveHours}`);
        return; // Skip balance update if leave type or hours are invalid
      }
      
      // Map leaveType to match leave_balances format
      // Handle common variations and typos
      const leaveTypeMap = {
        'annual': 'annual',
        'earned': 'annual',
        'earned leave': 'annual',
        'sick': 'sick',
        'sick leave': 'sick',
        'casual': 'casual',
        'casual leave': 'casual',
        'vacation': 'casual',
        'vecation': 'casual', // Handle typo
        'vacation leave': 'casual',
        'emergency': 'emergency',
        'emergency leave': 'emergency',
      };
      
      const normalizedLeaveType = leaveTypeMap[leaveType] || leaveType;
      console.log(`Normalized leave type: ${normalizedLeaveType} (from: ${leaveType})`);
      
      // Check if balance exists
      const balanceCheckSql = `
        SELECT id, balance, used FROM leave_balances
        WHERE employee_id = ? AND leave_type = ? AND year = ?
      `;
      const balanceCheck = await query(balanceCheckSql, [employeeId, normalizedLeaveType, year]);
      
      if (balanceCheck.length > 0) {
        const currentBalance = parseFloat(balanceCheck[0].balance) || 0;
        const currentUsed = parseFloat(balanceCheck[0].used) || 0;
        
        console.log(`Current balance: ${currentBalance}, Current used: ${currentUsed}, Requested: ${leaveHours}`);
        
        // Only reduce if balance is sufficient
        if (currentBalance >= leaveHours) {
          // Update leave balance
          const updateBalanceSql = `
            UPDATE leave_balances SET
              balance = balance - ?,
              used = used + ?
            WHERE employee_id = ? AND leave_type = ? AND year = ?
          `;
          const updateResult = await query(updateBalanceSql, [
            leaveHours,
            leaveHours,
            employeeId,
            normalizedLeaveType,
            year
          ]);
          
          // Verify the update
          const verifySql = `
            SELECT balance, used FROM leave_balances
            WHERE employee_id = ? AND leave_type = ? AND year = ?
          `;
          const verifyResult = await query(verifySql, [employeeId, normalizedLeaveType, year]);
          
          if (verifyResult.length > 0) {
            console.log(
              `✓ Leave balance updated successfully: Employee ${employeeId}, ` +
              `Type: ${normalizedLeaveType}, Hours: ${leaveHours}, Year: ${year}. ` +
              `New balance: ${verifyResult[0].balance}, New used: ${verifyResult[0].used}`
            );
          } else {
            console.error(`Failed to verify balance update for employee ${employeeId}`);
          }
        } else {
          console.warn(
            `⚠ Insufficient leave balance for employee ${employeeId}. ` +
            `Available: ${currentBalance}, Requested: ${leaveHours}. Leave still approved.`
          );
          // Still approve the leave, but log the warning
        }
      } else {
        console.warn(
          `⚠ Leave balance not found for employee ${employeeId}, ` +
          `leave_type: ${normalizedLeaveType}, year: ${year}. Leave still approved.`
        );
        // Still approve the leave, but log the warning
      }
    } catch (error) {
      // Log error but don't fail the approval
      console.error("❌ Error updating leave balance:", error);
      console.error("Error stack:", error.stack);
    }
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
    // Handle timesheet and workdetails as the same entity type
    if (entityType === "timesheet" || entityType === "workdetails") {
      sql += " AND (ah.entity_type = ? OR ah.entity_type = ?)";
      params.push("timesheet", "workdetails");
    } else {
      sql += " AND ah.entity_type = ?";
      params.push(entityType);
    }
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
    // Get all leaves that are pending (not approved or rejected)
    const leaveSql = `
      SELECT l.*, 
             COALESCE(e.employeeName, l.employeeName) as employeeName, 
             e.EMPID, 
             e.userName
      FROM leavedetails l
      LEFT JOIN employee e ON (
        CASE 
          WHEN l.employeeId IS NOT NULL AND l.employeeId != '' THEN CAST(l.employeeId AS UNSIGNED) = e.id
          ELSE l.employeeName = e.userName
        END
      )
      WHERE COALESCE(l.leaveStatus, '') NOT IN ('approved', 'rejected')
      ORDER BY l.leaveFrom DESC, l.id DESC
    `;
    const leaves = await query(leaveSql);
    leaves.forEach((leave) => {
      pendingApprovals.push({
        entityType: "leave",
        entityId: leave.id,
        entity: leave,
        requestedBy: leave.employeeName || leave.userName || 'Unknown',
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
      SELECT wd.*, 
             COALESCE(e.employeeName, wd.employeeName) as employeeName, 
             e.EMPID,
             wd.totalHours
      FROM workdetails wd
      LEFT JOIN employee e ON wd.userName = e.userName
      WHERE COALESCE(wd.status, '') NOT IN ('approved', 'rejected')
      ORDER BY wd.sentDate DESC, wd.id DESC
    `;
    const timesheets = await query(timesheetSql);
    timesheets.forEach((ts) => {
      pendingApprovals.push({
        entityType: "timesheet",
        entityId: ts.id,
        entity: {
          ...ts,
          totalHours: ts.totalHours || ts.totalhours || 0, // Ensure totalHours is included
        },
        requestedBy: ts.employeeName || 'Unknown',
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

