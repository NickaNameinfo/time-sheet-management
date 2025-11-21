import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Get Project Budget
export const getProjectBudget = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const sql = `
    SELECT pb.*, p.projectName, p.referenceNo
    FROM project_budgets pb
    LEFT JOIN project p ON pb.project_id = p.id
    WHERE pb.project_id = ?
    ORDER BY pb.created_at DESC
  `;
  const results = await query(sql, [projectId]);

  return sendSuccess(res, results);
});

// Create/Update Project Budget
export const setProjectBudget = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { budgetAmount, budgetHours, currency, budgetType, startDate, endDate } = req.body;

  if (!budgetAmount || !budgetHours) {
    return sendError(res, "budgetAmount and budgetHours are required", 400);
  }

  // Check if budget exists
  const checkSql = "SELECT id FROM project_budgets WHERE project_id = ? AND budget_type = ?";
  const existing = await query(checkSql, [projectId, budgetType || "total"]);

  if (existing.length > 0) {
    // Update
    const updateSql = `
      UPDATE project_budgets SET
        budget_amount = ?,
        budget_hours = ?,
        currency = ?,
        start_date = ?,
        end_date = ?
      WHERE project_id = ? AND budget_type = ?
    `;
    await query(updateSql, [
      budgetAmount,
      budgetHours,
      currency || "AED",
      startDate,
      endDate,
      projectId,
      budgetType || "total",
    ]);
    return sendSuccess(res, null, "Budget updated successfully");
  } else {
    // Create
    const insertSql = `
      INSERT INTO project_budgets (project_id, budget_amount, budget_hours, currency, budget_type, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await query(insertSql, [
      projectId,
      budgetAmount,
      budgetHours,
      currency || "AED",
      budgetType || "total",
      startDate,
      endDate,
    ]);
    return sendSuccess(res, null, "Budget created successfully");
  }
});

// Track Project Cost
export const trackProjectCost = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { costDate, employeeCost, overheadCost, materialCost, hoursSpent } = req.body;

  if (!costDate) {
    return sendError(res, "costDate is required", 400);
  }

  const totalCost =
    parseFloat(employeeCost || 0) +
    parseFloat(overheadCost || 0) +
    parseFloat(materialCost || 0);

  const insertSql = `
    INSERT INTO project_costs (project_id, cost_date, employee_cost, overhead_cost, material_cost, total_cost, hours_spent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  await query(insertSql, [
    projectId,
    costDate,
    employeeCost || 0,
    overheadCost || 0,
    materialCost || 0,
    totalCost,
    hoursSpent || 0,
  ]);

  return sendSuccess(res, null, "Cost tracked successfully");
});

// Get Project Costs
export const getProjectCosts = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { startDate, endDate } = req.query;

  let sql = "SELECT * FROM project_costs WHERE project_id = ?";
  const params = [projectId];

  if (startDate) {
    sql += " AND cost_date >= ?";
    params.push(startDate);
  }
  if (endDate) {
    sql += " AND cost_date <= ?";
    params.push(endDate);
  }

  sql += " ORDER BY cost_date DESC";

  const results = await query(sql, params);
  return sendSuccess(res, results);
});

// Get Budget vs Actual Report
export const getBudgetVsActual = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Get budget
  const budgetSql = `
    SELECT * FROM project_budgets 
    WHERE project_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `;
  const budgets = await query(budgetSql, [projectId]);
  const budget = budgets[0] || { budget_amount: 0, budget_hours: 0 };

  // Get actual costs
  const costsSql = `
    SELECT 
      SUM(total_cost) as total_cost,
      SUM(hours_spent) as total_hours
    FROM project_costs
    WHERE project_id = ?
  `;
  const costs = await query(costsSql, [projectId]);
  const actual = costs[0] || { total_cost: 0, total_hours: 0 };

  // Get approved hours from work details
  // workdetails table uses referenceNo or projectName, not projectNo
  const projectSql = "SELECT referenceNo, projectName FROM project WHERE id = ?";
  const projects = await query(projectSql, [projectId]);
  let actualHours = 0;
  
  if (projects.length > 0) {
    const project = projects[0];
    const hoursSql = `
      SELECT SUM(totalHours) as total_hours
      FROM workdetails
      WHERE (referenceNo = ? OR projectName = ?)
      AND status = 'approved'
    `;
    const hours = await query(hoursSql, [project.referenceNo || project.projectName, project.projectName]);
    actualHours = parseFloat(hours[0]?.total_hours || 0);
  }

  const budgetAmount = parseFloat(budget.budget_amount || 0);
  const actualCost = parseFloat(actual.total_cost || 0);
  const budgetHours = parseFloat(budget.budget_hours || 0);

  const variance = budgetAmount - actualCost;
  const variancePercent = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;
  const hoursVariance = budgetHours - actualHours;
  const hoursVariancePercent = budgetHours > 0 ? (hoursVariance / budgetHours) * 100 : 0;

  return sendSuccess(res, {
    projectId,
    budget: {
      amount: budgetAmount,
      hours: budgetHours,
    },
    actual: {
      cost: actualCost,
      hours: actualHours,
    },
    variance: {
      amount: variance,
      percent: variancePercent.toFixed(2),
      hours: hoursVariance,
      hoursPercent: hoursVariancePercent.toFixed(2),
    },
    status: variance >= 0 ? "under_budget" : "over_budget",
  });
});

// Get Profitability Report
export const getProfitabilityReport = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Get project
  const projectSql = "SELECT * FROM project WHERE id = ?";
  const projects = await query(projectSql, [projectId]);
  if (projects.length === 0) {
    return sendError(res, "Project not found", 404);
  }
  const project = projects[0];

  // Get total revenue (from invoices or billing)
  const revenueSql = `
    SELECT SUM(total_amount) as total_revenue
    FROM invoices
    WHERE project_id = ? AND status = 'paid'
  `;
  const revenue = await query(revenueSql, [projectId]);
  const totalRevenue = parseFloat(revenue[0]?.total_revenue || 0);

  // Get total costs
  const costsSql = `
    SELECT SUM(total_cost) as total_cost
    FROM project_costs
    WHERE project_id = ?
  `;
  const costs = await query(costsSql, [projectId]);
  const totalCost = parseFloat(costs[0]?.total_cost || 0);

  const profit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

  return sendSuccess(res, {
    projectId,
    projectName: project.projectName,
    revenue: totalRevenue,
    cost: totalCost,
    profit,
    margin: margin.toFixed(2),
    roi: roi.toFixed(2),
    status: profit >= 0 ? "profitable" : "loss",
  });
});

