import { getTenantQuery } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Helper function to calculate productivity for an employee on a specific date
// This can be called from both the API endpoint and from approval controller
export const calculateProductivityForEmployee = async (req, employeeId, date) => {
  const q = getTenantQuery(req);
  // Get employee info - employeeId can be employee.id or EMPID
  const employeeSql = `
    SELECT id, EMPID, userName 
    FROM employee 
    WHERE id = ? OR EMPID = ?
    LIMIT 1
  `;
  const employeeResult = await q(employeeSql, [employeeId, employeeId]);
  
  if (employeeResult.length === 0) {
    throw new Error(`Employee not found: ${employeeId}`);
  }
  
  const employee = employeeResult[0];
  const actualEmployeeId = employee.id; // Use the actual employee.id for productivity_metrics
  
  // Get work details for the day - match by employeeNo (which is EMPID) or userName
  // Handle different date formats in sentDate (sentDate is stored as VARCHAR)
  // Use the same date parsing logic as in other controllers
  const workSql = `
    SELECT 
      SUM(CAST(totalHours AS DECIMAL(10,2))) as total_hours, 
      COUNT(*) as tasks_completed,
      GROUP_CONCAT(id) as workdetail_ids
    FROM workdetails
    WHERE (
      (employeeNo = ? OR employeeNo = ?) OR
      userName = ?
    )
    AND (
      DATE(STR_TO_DATE(SUBSTRING(sentDate, 1, 10), '%Y-%m-%d')) = ? OR
      DATE(STR_TO_DATE(sentDate, '%Y-%m-%d')) = ? OR
      DATE(sentDate) = ? OR
      SUBSTRING(sentDate, 1, 10) = ?
    )
    AND status = 'approved'
    AND totalHours IS NOT NULL
    AND totalHours != ''
    AND CAST(totalHours AS DECIMAL(10,2)) > 0
  `;
  const workData = await q(workSql, [
    employee.EMPID || employee.id,
    String(employee.EMPID || employee.id), // Try as string too
    employee.userName,
    date,
    date,
    date,
    date // Also try direct string comparison
  ]);
  
  const totalHours = parseFloat(workData[0]?.total_hours || 0);
  const tasksCompleted = parseInt(workData[0]?.tasks_completed || 0);
  
  console.log(`[Productivity] Query for employee ${actualEmployeeId} (EMPID: ${employee.EMPID}, userName: ${employee.userName}) on date ${date}`);
  console.log(`[Productivity] Found ${tasksCompleted} tasks, Total hours: ${totalHours}`);
  if (workData[0]?.workdetail_ids) {
    console.log(`[Productivity] Workdetail IDs: ${workData[0].workdetail_ids}`);
  }

  // Get assigned tasks (if you have a tasks table, otherwise use work details count)
  const assignedTasks = tasksCompleted; // Simplified - should come from tasks table

  // Calculate productivity score (simplified formula)
  // Productivity = (productive_hours / total_hours) * 100
  // For now, assuming all approved hours are productive
  const productiveHours = totalHours;
  const productivityScore = totalHours > 0 ? (productiveHours / 8) * 100 : 0; // Assuming 8 hours standard
  // Cap productivity score at 100%
  const cappedProductivityScore = Math.min(productivityScore, 100);
  const taskCompletionRate =
    assignedTasks > 0 ? (tasksCompleted / assignedTasks) * 100 : 0;

  // Calculate idle time (simplified - difference between expected and actual)
  const expectedHours = 8; // Standard work day
  const idleTimeMinutes = totalHours < expectedHours ? (expectedHours - totalHours) * 60 : 0;

  // Check if metric exists
  const checkSql = "SELECT id FROM productivity_metrics WHERE employee_id = ? AND metric_date = ?";
  const existing = await q(checkSql, [actualEmployeeId, date]);

  if (existing.length > 0) {
    // Update
    const updateSql = `
      UPDATE productivity_metrics SET
        total_hours = ?,
        productive_hours = ?,
        idle_time_minutes = ?,
        tasks_completed = ?,
        tasks_assigned = ?,
        productivity_score = ?,
        task_completion_rate = ?
      WHERE employee_id = ? AND metric_date = ?
    `;
    await q(updateSql, [
      totalHours,
      productiveHours,
      idleTimeMinutes,
      tasksCompleted,
      assignedTasks,
      cappedProductivityScore,
      taskCompletionRate,
      actualEmployeeId,
      date,
    ]);
  } else {
    // Insert
    const insertSql = `
      INSERT INTO productivity_metrics (
        employee_id, metric_date, total_hours, productive_hours,
        idle_time_minutes, tasks_completed, tasks_assigned,
        productivity_score, task_completion_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await q(insertSql, [
      actualEmployeeId,
      date,
      totalHours,
      productiveHours,
      idleTimeMinutes,
      tasksCompleted,
      assignedTasks,
      cappedProductivityScore,
      taskCompletionRate,
    ]);
  }

  return {
    employeeId: actualEmployeeId,
    date,
    totalHours,
    productiveHours,
    idleTimeMinutes,
    tasksCompleted,
    tasksAssigned: assignedTasks,
    productivityScore: cappedProductivityScore.toFixed(2),
    taskCompletionRate: taskCompletionRate.toFixed(2),
  };
};

// Calculate Productivity Score (API Endpoint)
export const calculateProductivity = asyncHandler(async (req, res) => {
  const { employeeId, date } = req.body;

  if (!employeeId || !date) {
    return sendError(res, "employeeId and date are required", 400);
  }

  try {
    const result = await calculateProductivityForEmployee(req, employeeId, date);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error.message || "Failed to calculate productivity", 500);
  }
});

// Get Productivity Metrics
export const getProductivityMetrics = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { employeeId, startDate, endDate, teamId } = req.query;

  let sql = `
    SELECT pm.*, e.employeeName, e.EMPID, e.designation
    FROM productivity_metrics pm
    LEFT JOIN employee e ON pm.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];

  // Only filter by employeeId if it's provided and not empty
  if (employeeId && employeeId !== "" && employeeId !== "undefined" && employeeId !== "null") {
    sql += " AND pm.employee_id = ?";
    params.push(employeeId);
  }
  if (startDate) {
    sql += " AND pm.metric_date >= ?";
    params.push(startDate);
  }
  if (endDate) {
    sql += " AND pm.metric_date <= ?";
    params.push(endDate);
  }
  if (teamId) {
    // Get team members by matching tlName in workdetails with team lead
    const teamLeadSql = "SELECT leadName, EMPID FROM team_lead WHERE id = ? LIMIT 1";
    const teamLeadResult = await q(teamLeadSql, [teamId]);
    
    if (teamLeadResult.length > 0) {
      const teamLead = teamLeadResult[0];
      sql += ` AND (
        e.EMPID = ? OR
        e.id IN (
          SELECT DISTINCT 
            CASE 
              WHEN w.employeeNo IS NOT NULL AND w.employeeNo != '' THEN 
                (SELECT id FROM employee WHERE EMPID = w.employeeNo LIMIT 1)
              WHEN w.userName IS NOT NULL AND w.userName != '' THEN 
                (SELECT id FROM employee WHERE userName = w.userName LIMIT 1)
              ELSE NULL
            END as emp_id
          FROM workdetails w
          WHERE (w.tlName = ? OR w.tlName = ?)
            AND (w.employeeNo IS NOT NULL OR w.userName IS NOT NULL)
        )
      )`;
      params.push(teamLead.EMPID || teamId, teamLead.leadName, teamId.toString());
    }
  }

  sql += " ORDER BY pm.metric_date DESC, pm.productivity_score DESC";

  const results = await q(sql, params);
  return sendSuccess(res, results);
});

// Get Team Productivity
export const getTeamProductivity = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { teamLeadId, startDate, endDate } = req.query;

  if (!teamLeadId) {
    return sendError(res, "teamLeadId is required", 400);
  }

  // Get team lead info first
  const teamLeadSql = "SELECT id, leadName, EMPID FROM team_lead WHERE id = ? LIMIT 1";
  const teamLeadResult = await q(teamLeadSql, [teamLeadId]);
  
  if (teamLeadResult.length === 0) {
    return sendError(res, "Team lead not found", 404);
  }
  
  const teamLead = teamLeadResult[0];
  const teamLeadName = teamLead.leadName;
  const teamLeadEmpId = teamLead.EMPID;
  
  // Get team members - employees whose workdetails have tlName matching the team lead's name or id
  // Match by userName or employeeNo from workdetails where tlName matches
  const teamSql = `
    SELECT DISTINCT e.id, e.employeeName, e.EMPID
    FROM employee e
    WHERE e.id IN (
      SELECT DISTINCT 
        CASE 
          WHEN w.employeeNo IS NOT NULL AND w.employeeNo != '' THEN 
            (SELECT id FROM employee WHERE EMPID = w.employeeNo LIMIT 1)
          WHEN w.userName IS NOT NULL AND w.userName != '' THEN 
            (SELECT id FROM employee WHERE userName = w.userName LIMIT 1)
          ELSE NULL
        END as emp_id
      FROM workdetails w
      WHERE (w.tlName = ? OR w.tlName = ?)
        AND (w.employeeNo IS NOT NULL OR w.userName IS NOT NULL)
    )
    OR e.EMPID = ?
    OR (e.role LIKE '%TL%' AND e.EMPID = ?)
  `;
  const teamMembers = await q(teamSql, [
    teamLeadName,
    teamLeadId.toString(),
    teamLeadEmpId || teamLeadId,
    teamLeadEmpId || teamLeadId
  ]);

  const teamMetrics = [];

  for (const member of teamMembers) {
    const metricsSql = `
      SELECT 
        AVG(productivity_score) as avg_productivity,
        AVG(task_completion_rate) as avg_completion_rate,
        SUM(total_hours) as total_hours,
        SUM(idle_time_minutes) as total_idle_time,
        COUNT(*) as days_worked
      FROM productivity_metrics
      WHERE employee_id = ?
      AND metric_date BETWEEN ? AND ?
    `;
    const metrics = await q(metricsSql, [member.id, startDate || "1900-01-01", endDate || "9999-12-31"]);

    if (metrics[0] && metrics[0].days_worked > 0) {
      teamMetrics.push({
        employeeId: member.id,
        employeeName: member.employeeName,
        empId: member.EMPID,
        avgProductivity: parseFloat(metrics[0].avg_productivity || 0).toFixed(2),
        avgCompletionRate: parseFloat(metrics[0].avg_completion_rate || 0).toFixed(2),
        totalHours: parseFloat(metrics[0].total_hours || 0).toFixed(2),
        totalIdleTime: parseInt(metrics[0].total_idle_time || 0),
        daysWorked: parseInt(metrics[0].days_worked || 0),
      });
    }
  }

  // Calculate team average
  const teamAvg = teamMetrics.length > 0
    ? {
        avgProductivity: (
          teamMetrics.reduce((sum, m) => sum + parseFloat(m.avgProductivity), 0) /
          teamMetrics.length
        ).toFixed(2),
        avgCompletionRate: (
          teamMetrics.reduce((sum, m) => sum + parseFloat(m.avgCompletionRate), 0) /
          teamMetrics.length
        ).toFixed(2),
        totalHours: teamMetrics.reduce((sum, m) => sum + parseFloat(m.totalHours), 0).toFixed(2),
      }
    : null;

  return sendSuccess(res, {
    teamLeadId,
    period: { startDate, endDate },
    teamMetrics,
    teamAverage: teamAvg,
  });
});

// Get Productivity Trends
export const getProductivityTrends = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { employeeId, period } = req.query; // period: 'daily', 'weekly', 'monthly'

  if (!employeeId) {
    return sendError(res, "employeeId is required", 400);
  }

  let dateFormat = "%Y-%m-%d";
  let groupBy = "metric_date";

  if (period === "weekly") {
    dateFormat = "%Y-%u";
    groupBy = "YEARWEEK(metric_date)";
  } else if (period === "monthly") {
    dateFormat = "%Y-%m";
    groupBy = "DATE_FORMAT(metric_date, '%Y-%m')";
  }

  const sql = `
    SELECT 
      ${groupBy} as period,
      AVG(productivity_score) as avg_productivity,
      AVG(task_completion_rate) as avg_completion_rate,
      SUM(total_hours) as total_hours,
      COUNT(*) as data_points
    FROM productivity_metrics
    WHERE employee_id = ?
    GROUP BY ${groupBy}
    ORDER BY period DESC
    LIMIT 12
  `;

  const results = await q(sql, [employeeId]);
  return sendSuccess(res, results);
});

