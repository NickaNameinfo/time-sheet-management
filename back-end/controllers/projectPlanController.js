import { getTenantQuery } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Helper function to calculate end date based on time period
const calculateEndDate = (startDate, timePeriod) => {
  const start = new Date(startDate);
  const end = new Date(start);
  
  switch (timePeriod) {
    case 'weekly':
      end.setDate(end.getDate() + 7);
      break;
    case 'monthly':
      end.setMonth(end.getMonth() + 1);
      break;
    case '3_months':
      end.setMonth(end.getMonth() + 3);
      break;
    case '6_months':
      end.setMonth(end.getMonth() + 6);
      break;
    case '9_months':
      end.setMonth(end.getMonth() + 9);
      break;
    case 'yearly':
      end.setFullYear(end.getFullYear() + 1);
      break;
    default:
      end.setMonth(end.getMonth() + 1);
  }
  
  return end.toISOString().split('T')[0];
};

// Create a new project plan
export const createProjectPlan = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const {
    plan_name,
    project_id,
    time_period,
    start_date,
    total_allotted_hours,
    description,
    employee_ids = [],
    employee_hours = {},
  } = req.body;

  if (!plan_name || !project_id || !time_period || !start_date || !total_allotted_hours) {
    return sendError(res, "Missing required fields", 400);
  }

  // Get project details to check allotted hours and target date
  const projectSql = "SELECT allotatedHours, targetDate FROM project WHERE id = ?";
  const projects = await q(projectSql, [project_id]);
  
  if (projects.length === 0) {
    return sendError(res, "Project not found", 404);
  }
  
  const project = projects[0];
  const projectAllottedHours = parseFloat(project.allotatedHours) || 0;
  
  // Check if plan hours exceed project allotted hours
  // Get sum of existing plan hours for this project
  const existingPlansSql = `
    SELECT SUM(total_allotted_hours) as total_plan_hours 
    FROM project_plans 
    WHERE project_id = ? AND status != 'cancelled'
  `;
  const existingPlans = await q(existingPlansSql, [project_id]);
  const existingPlanHours = parseFloat(existingPlans[0]?.total_plan_hours || 0);
  const remainingHours = projectAllottedHours - existingPlanHours;
  
  if (parseFloat(total_allotted_hours) > remainingHours) {
    return sendError(
      res,
      `Plan hours (${total_allotted_hours}) exceed remaining project hours (${remainingHours.toFixed(2)})`,
      400
    );
  }

  // Calculate end date based on time period
  let end_date = calculateEndDate(start_date, time_period);
  
  // Don't exceed project target date if it exists
  if (project.targetDate) {
    const projectTargetDate = new Date(project.targetDate);
    const calculatedEndDate = new Date(end_date);
    if (calculatedEndDate > projectTargetDate) {
      end_date = project.targetDate;
    }
  }

  // Insert project plan
  const planSql = `
    INSERT INTO project_plans 
    (plan_name, project_id, time_period, start_date, end_date, total_allotted_hours, description, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')
  `;
  
  const planValues = [
    plan_name,
    project_id,
    time_period,
    start_date,
    end_date,
    total_allotted_hours,
    description || null,
    req.user?.id || null,
  ];

  const planResult = await q(planSql, planValues);
  const planId = planResult.insertId;

  // Assign employees if provided
  if (Array.isArray(employee_ids) && employee_ids.length > 0) {
    const employeeSql = `
      INSERT INTO project_plan_employees 
      (project_plan_id, employee_id, allotted_hours, assigned_date, status)
      VALUES (?, ?, ?, ?, 'assigned')
    `;

    for (const employeeId of employee_ids) {
      const hours = employee_hours[employeeId] || 0;
      await q(employeeSql, [planId, employeeId, hours, start_date]);
    }
  }

  return sendSuccess(res, { planId }, "Project plan created successfully");
});

// Get all project plans (with utilized hours and progress from workdetails)
export const getProjectPlans = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { project_id, status, time_period, employee_id, plan_id } = req.query;
  
  let sql = `
    SELECT 
      pp.*,
      p.projectName,
      p.projectNo,
      p.referenceNo,
      e.employeeName as created_by_name,
      COUNT(DISTINCT ppe.employee_id) as assigned_employees_count,
      COALESCE(SUM(ppe.allotted_hours), 0) as total_assigned_hours,
      (SELECT COALESCE(SUM(CAST(w.totalHours AS DECIMAL(10,2))), 0)
       FROM workdetails w
       WHERE (w.projectNo = p.projectNo OR w.referenceNo = p.referenceNo OR w.projectName = p.projectName)
         AND DATE(w.sentDate) >= pp.start_date AND DATE(w.sentDate) <= pp.end_date
      ) as utilized_hours
    FROM project_plans pp
    LEFT JOIN project p ON pp.project_id = p.id
    LEFT JOIN employee e ON pp.created_by = e.id
    LEFT JOIN project_plan_employees ppe ON pp.id = ppe.project_plan_id AND ppe.status != 'removed'
  `;
  
  const conditions = [];
  const values = [];
  
  if (project_id) {
    conditions.push("pp.project_id = ?");
    values.push(project_id);
  }
  
  if (status) {
    conditions.push("pp.status = ?");
    values.push(status);
  }
  
  if (time_period) {
    conditions.push("pp.time_period = ?");
    values.push(time_period);
  }
  
  if (employee_id) {
    conditions.push("pp.id IN (SELECT project_plan_id FROM project_plan_employees WHERE employee_id = ? AND status != 'removed')");
    values.push(employee_id);
  }
  
  if (plan_id) {
    conditions.push("pp.id = ?");
    values.push(plan_id);
  }
  
  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  
  sql += " GROUP BY pp.id ORDER BY FIELD(pp.status, 'active', 'draft', 'completed', 'cancelled'), pp.created_at DESC";
  
  const plans = await q(sql, values);
  
  // Add progress_percent (utilized / total_allotted_hours * 100)
  const plansWithProgress = plans.map((plan) => {
    const total = parseFloat(plan.total_allotted_hours) || 0;
    const utilized = parseFloat(plan.utilized_hours) || 0;
    const progress_percent = total > 0 ? Math.min(100, Math.round((utilized / total) * 100)) : 0;
    return { ...plan, progress_percent };
  });
  
  return sendSuccess(res, plansWithProgress);
});

// Get project plan by ID with employees
export const getProjectPlanById = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  
  // Get plan details
  const planSql = `
    SELECT 
      pp.*,
      p.projectName,
      p.projectNo,
      e.employeeName as created_by_name
    FROM project_plans pp
    LEFT JOIN project p ON pp.project_id = p.id
    LEFT JOIN employee e ON pp.created_by = e.id
    WHERE pp.id = ?
  `;
  
  const plans = await q(planSql, [id]);
  
  if (plans.length === 0) {
    return sendError(res, "Project plan not found", 404);
  }
  
  const plan = plans[0];
  
  // Get assigned employees
  const employeesSql = `
    SELECT 
      ppe.*,
      e.employeeName,
      e.EMPID,
      e.designation,
      e.discipline
    FROM project_plan_employees ppe
    LEFT JOIN employee e ON ppe.employee_id = e.id
    WHERE ppe.project_plan_id = ? AND ppe.status != 'removed'
    ORDER BY ppe.assigned_date DESC
  `;
  
  const employees = await q(employeesSql, [id]);
  plan.employees = employees;
  
  return sendSuccess(res, plan);
});

// Get plan utilization (utilized hours + log details from workdetails)
export const getPlanUtilization = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  
  const planSql = `
    SELECT pp.id, pp.start_date, pp.end_date, pp.total_allotted_hours,
           p.projectNo, p.referenceNo, p.projectName
    FROM project_plans pp
    LEFT JOIN project p ON pp.project_id = p.id
    WHERE pp.id = ?
  `;
  const plans = await q(planSql, [id]);
  if (plans.length === 0) return sendError(res, "Project plan not found", 404);
  
  const plan = plans[0];
  const totalAllotted = parseFloat(plan.total_allotted_hours) || 0;
  
  // Match workdetails by project (projectNo, referenceNo, projectName) and date range
  const logSql = `
    SELECT w.id, w.employeeName, w.userName, w.sentDate, w.clockInTime, w.clockOutTime,
           CAST(w.totalHours AS DECIMAL(10,2)) as totalHours, w.status, w.projectName, w.projectNo
    FROM workdetails w
    WHERE (w.projectNo = ? OR w.referenceNo = ? OR w.projectName = ?)
      AND DATE(w.sentDate) >= ? AND DATE(w.sentDate) <= ?
    ORDER BY w.sentDate DESC, w.id DESC
  `;
  const logRows = await q(logSql, [
    plan.projectNo || '',
    plan.referenceNo || '',
    plan.projectName || '',
    plan.start_date,
    plan.end_date,
  ]);
  
  const utilizedHours = logRows.reduce((sum, row) => sum + (parseFloat(row.totalHours) || 0), 0);
  const progressPercent = totalAllotted > 0 ? Math.min(100, Math.round((utilizedHours / totalAllotted) * 100)) : 0;
  
  return sendSuccess(res, {
    utilized_hours: Math.round(utilizedHours * 100) / 100,
    total_allotted_hours: totalAllotted,
    progress_percent: progressPercent,
    log_details: logRows,
  });
});

// Update project plan
export const updateProjectPlan = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const {
    plan_name,
    time_period,
    start_date,
    total_allotted_hours,
    description,
    status,
  } = req.body;
  
  // Check if plan exists
  const checkSql = "SELECT * FROM project_plans WHERE id = ?";
  const existing = await q(checkSql, [id]);
  
  if (existing.length === 0) {
    return sendError(res, "Project plan not found", 404);
  }
  
  const updateFields = [];
  const values = [];
  
  if (plan_name !== undefined) {
    updateFields.push("plan_name = ?");
    values.push(plan_name);
  }
  
  if (time_period !== undefined) {
    updateFields.push("time_period = ?");
    values.push(time_period);
    
    // Recalculate end date if time period changed
    const currentStartDate = start_date || existing[0].start_date;
    if (currentStartDate) {
      let end_date = calculateEndDate(currentStartDate, time_period);
      
      // Get project target date to limit end date
      const projectSql = "SELECT targetDate FROM project WHERE id = ?";
      const projects = await q(projectSql, [existing[0].project_id]);
      if (projects.length > 0 && projects[0].targetDate) {
        const projectTargetDate = new Date(projects[0].targetDate);
        const calculatedEndDate = new Date(end_date);
        if (calculatedEndDate > projectTargetDate) {
          end_date = projects[0].targetDate;
        }
      }
      
      updateFields.push("end_date = ?");
      values.push(end_date);
    }
  }
  
  if (start_date !== undefined) {
    updateFields.push("start_date = ?");
    values.push(start_date);
    
    // Recalculate end date
    const currentPeriod = time_period || existing[0].time_period;
    let end_date = calculateEndDate(start_date, currentPeriod);
    
    // Get project target date to limit end date
    const projectSql = "SELECT targetDate FROM project WHERE id = ?";
    const projects = await q(projectSql, [existing[0].project_id]);
    if (projects.length > 0 && projects[0].targetDate) {
      const projectTargetDate = new Date(projects[0].targetDate);
      const calculatedEndDate = new Date(end_date);
      if (calculatedEndDate > projectTargetDate) {
        end_date = projects[0].targetDate;
      }
    }
    
    updateFields.push("end_date = ?");
    values.push(end_date);
  }
  
  // Validate total_allotted_hours doesn't exceed project remaining hours
  if (total_allotted_hours !== undefined) {
    const projectSql = "SELECT allotatedHours FROM project WHERE id = ?";
    const projects = await q(projectSql, [existing[0].project_id]);
    
    if (projects.length > 0) {
      const projectAllottedHours = parseFloat(projects[0].allotatedHours) || 0;
      
      // Get sum of existing plan hours (excluding current plan being updated)
      const existingPlansSql = `
        SELECT SUM(total_allotted_hours) as total_plan_hours 
        FROM project_plans 
        WHERE project_id = ? AND id != ? AND status != 'cancelled'
      `;
      const existingPlans = await q(existingPlansSql, [existing[0].project_id, id]);
      const existingPlanHours = parseFloat(existingPlans[0]?.total_plan_hours || 0);
      const remainingHours = projectAllottedHours - existingPlanHours;
      
      if (parseFloat(total_allotted_hours) > remainingHours) {
        return sendError(
          res,
          `Plan hours (${total_allotted_hours}) exceed remaining project hours (${remainingHours.toFixed(2)})`,
          400
        );
      }
    }
  }
  
  if (total_allotted_hours !== undefined) {
    updateFields.push("total_allotted_hours = ?");
    values.push(total_allotted_hours);
  }
  
  if (description !== undefined) {
    updateFields.push("description = ?");
    values.push(description);
  }
  
  if (status !== undefined) {
    updateFields.push("status = ?");
    values.push(status);
  }
  
  if (updateFields.length === 0) {
    return sendError(res, "No fields to update", 400);
  }
  
  values.push(id);
  
  const sql = `UPDATE project_plans SET ${updateFields.join(", ")} WHERE id = ?`;
  await q(sql, values);
  
  return sendSuccess(res, null, "Project plan updated successfully");
});

// Assign employees to project plan
export const assignEmployeesToPlan = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const { employee_ids = [], employee_hours = {}, remove_employee_ids = [] } = req.body;
  
  // Check if plan exists
  const checkSql = "SELECT * FROM project_plans WHERE id = ?";
  const existing = await q(checkSql, [id]);
  
  if (existing.length === 0) {
    return sendError(res, "Project plan not found", 404);
  }
  
  const plan = existing[0];
  
  // Remove employees if specified
  if (Array.isArray(remove_employee_ids) && remove_employee_ids.length > 0) {
    const removeSql = `
      UPDATE project_plan_employees 
      SET status = 'removed' 
      WHERE project_plan_id = ? AND employee_id IN (?)
    `;
    await q(removeSql, [id, remove_employee_ids]);
  }
  
  // Add new employees
  if (Array.isArray(employee_ids) && employee_ids.length > 0) {
    const employeeSql = `
      INSERT INTO project_plan_employees 
      (project_plan_id, employee_id, allotted_hours, assigned_date, status)
      VALUES (?, ?, ?, ?, 'assigned')
      ON DUPLICATE KEY UPDATE 
        allotted_hours = VALUES(allotted_hours),
        status = 'assigned',
        assigned_date = VALUES(assigned_date)
    `;

    for (const employeeId of employee_ids) {
      const hours = employee_hours[employeeId] || 0;
      await q(employeeSql, [id, employeeId, hours, plan.start_date]);
    }
  }
  
  return sendSuccess(res, null, "Employees assigned successfully");
});

// Get employees from a project (for assignment)
export const getProjectEmployees = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { project_id } = req.params;
  
  // First, get the project to check assignedEmployees
  const projectSql = "SELECT assignedEmployees FROM project WHERE id = ?";
  const projects = await q(projectSql, [project_id]);
  
  let employeeIds = [];
  
  if (projects.length > 0 && projects[0].assignedEmployees) {
    try {
      const assignedEmployees = JSON.parse(projects[0].assignedEmployees);
      if (Array.isArray(assignedEmployees)) {
        employeeIds = assignedEmployees.map(id => parseInt(id)).filter(id => !isNaN(id));
      }
    } catch (e) {
      console.error("Error parsing assignedEmployees:", e);
    }
  }
  
  // Also check project_employees table if it exists
  let projectEmployees = [];
  try {
    const projectEmpSql = "SELECT employee_id FROM project_employees WHERE project_id = ?";
    projectEmployees = await q(projectEmpSql, [project_id]);
    projectEmployees.forEach(pe => {
      if (!employeeIds.includes(pe.employee_id)) {
        employeeIds.push(pe.employee_id);
      }
    });
  } catch (e) {
    // Table might not exist, ignore
    console.warn("project_employees table might not exist:", e.message);
  }
  
  // Get employee details
  if (employeeIds.length === 0) {
    return sendSuccess(res, []);
  }
  
  const placeholders = employeeIds.map(() => '?').join(',');
  const sql = `
    SELECT 
      id,
      employeeName,
      EMPID,
      designation,
      discipline,
      employeeEmail
    FROM employee
    WHERE id IN (${placeholders})
  `;
  
  const employees = await q(sql, employeeIds);
  
  return sendSuccess(res, employees);
});

// Get assigned projects for an employee from project plans
// Matches project_plans + project_plan_employees: returns all assignments for the employee.
// employee_id can be employee.id (DB pk) or employee.EMPID.
export const getEmployeeAssignedProjects = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { employee_id } = req.query;
  
  if (!employee_id) {
    return sendError(res, "Employee ID is required", 400);
  }

  const paramId = parseInt(employee_id, 10);
  if (isNaN(paramId)) {
    return sendError(res, "Invalid employee ID", 400);
  }

  // Resolve to employee.id (project_plan_employees.employee_id references employee.id)
  let employeeDbId = paramId;
  const lookup = await q(
    "SELECT id FROM employee WHERE id = ? OR EMPID = ? LIMIT 1",
    [paramId, paramId]
  );
  if (lookup.length > 0) {
    employeeDbId = lookup[0].id;
  }
  
  // All rows from project_plan_employees for this employee, joined to project_plans and project.
  // Exclude only: assignment status 'removed', plan status 'cancelled'. Include active & completed plans.
  const sql = `
    SELECT 
      pp.id as plan_id,
      pp.plan_name,
      pp.time_period,
      pp.start_date,
      pp.end_date,
      pp.status as plan_status,
      pp.total_allotted_hours as plan_total_hours,
      ppe.id as assignment_id,
      ppe.allotted_hours,
      ppe.assigned_date,
      ppe.status as assignment_status,
      p.id as project_id,
      p.projectName,
      p.projectNo,
      p.referenceNo,
      p.taskJobNo,
      p.subDivision,
      p.allotatedHours as project_allotated_hours,
      p.desciplineCode,
      p.tlID,
      p.tlName
    FROM project_plan_employees ppe
    INNER JOIN project_plans pp ON ppe.project_plan_id = pp.id
    INNER JOIN project p ON pp.project_id = p.id
    WHERE ppe.employee_id = ?
      AND (ppe.status IS NULL OR ppe.status != 'removed')
      AND (pp.status IS NULL OR pp.status != 'cancelled')
    ORDER BY pp.start_date DESC, p.projectName ASC
  `;
  
  const assignedProjects = await q(sql, [employeeDbId]);
  
  return sendSuccess(res, assignedProjects);
});

// Delete project plan
export const deleteProjectPlan = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  
  const sql = "DELETE FROM project_plans WHERE id = ?";
  await q(sql, [id]);
  
  return sendSuccess(res, null, "Project plan deleted successfully");
});
