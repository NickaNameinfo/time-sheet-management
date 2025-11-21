import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Calculate Productivity Score
export const calculateProductivity = asyncHandler(async (req, res) => {
  const { employeeId, date } = req.body;

  if (!employeeId || !date) {
    return sendError(res, "employeeId and date are required", 400);
  }

  // Get work details for the day
  const workSql = `
    SELECT SUM(totalHours) as total_hours, COUNT(*) as tasks_completed
    FROM workdetails
    WHERE employeeNo = (SELECT EMPID FROM employee WHERE id = ?)
    AND DATE(sentDate) = ?
    AND status = 'approved'
  `;
  const workData = await query(workSql, [employeeId, date]);
  const totalHours = parseFloat(workData[0]?.total_hours || 0);
  const tasksCompleted = parseInt(workData[0]?.tasks_completed || 0);

  // Get assigned tasks (if you have a tasks table, otherwise use work details count)
  const assignedTasks = tasksCompleted; // Simplified - should come from tasks table

  // Calculate productivity score (simplified formula)
  // Productivity = (productive_hours / total_hours) * 100
  // For now, assuming all approved hours are productive
  const productiveHours = totalHours;
  const productivityScore = totalHours > 0 ? (productiveHours / 8) * 100 : 0; // Assuming 8 hours standard
  const taskCompletionRate =
    assignedTasks > 0 ? (tasksCompleted / assignedTasks) * 100 : 0;

  // Calculate idle time (simplified - difference between expected and actual)
  const expectedHours = 8; // Standard work day
  const idleTimeMinutes = totalHours < expectedHours ? (expectedHours - totalHours) * 60 : 0;

  // Check if metric exists
  const checkSql = "SELECT id FROM productivity_metrics WHERE employee_id = ? AND metric_date = ?";
  const existing = await query(checkSql, [employeeId, date]);

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
    await query(updateSql, [
      totalHours,
      productiveHours,
      idleTimeMinutes,
      tasksCompleted,
      assignedTasks,
      productivityScore,
      taskCompletionRate,
      employeeId,
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
    await query(insertSql, [
      employeeId,
      date,
      totalHours,
      productiveHours,
      idleTimeMinutes,
      tasksCompleted,
      assignedTasks,
      productivityScore,
      taskCompletionRate,
    ]);
  }

  return sendSuccess(res, {
    employeeId,
    date,
    totalHours,
    productiveHours,
    idleTimeMinutes,
    tasksCompleted,
    tasksAssigned: assignedTasks,
    productivityScore: productivityScore.toFixed(2),
    taskCompletionRate: taskCompletionRate.toFixed(2),
  });
});

// Get Productivity Metrics
export const getProductivityMetrics = asyncHandler(async (req, res) => {
  const { employeeId, startDate, endDate, teamId } = req.query;

  let sql = `
    SELECT pm.*, e.employeeName, e.EMPID, e.designation
    FROM productivity_metrics pm
    LEFT JOIN employee e ON pm.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (employeeId) {
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
    // Assuming team is based on TL assignment
    sql += " AND e.id IN (SELECT employee_id FROM team_lead WHERE id = ?)";
    params.push(teamId);
  }

  sql += " ORDER BY pm.metric_date DESC, pm.productivity_score DESC";

  const results = await query(sql, params);
  return sendSuccess(res, results);
});

// Get Team Productivity
export const getTeamProductivity = asyncHandler(async (req, res) => {
  const { teamLeadId, startDate, endDate } = req.query;

  if (!teamLeadId) {
    return sendError(res, "teamLeadId is required", 400);
  }

  // Get team members
  const teamSql = `
    SELECT e.id, e.employeeName, e.EMPID
    FROM employee e
    WHERE e.role LIKE '%TL%' OR e.id IN (
      SELECT employee_id FROM team_lead WHERE id = ?
    )
  `;
  const teamMembers = await query(teamSql, [teamLeadId]);

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
    const metrics = await query(metricsSql, [member.id, startDate || "1900-01-01", endDate || "9999-12-31"]);

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

  const results = await query(sql, [employeeId]);
  return sendSuccess(res, results);
});

