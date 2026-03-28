import { getTenantQuery } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const COMPANY_SIZE_OPTIONS = ["1–50", "51–200", "201–500", "501–1000", "1000+"];

// Create lead (Book a Demo form)
export const createLead = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { fullName, workEmail, companyName, companySize, phoneNumber } = req.body;

  if (!fullName || !workEmail || !companyName) {
    return sendError(res, "Full Name, Work Email and Company Name are required", 400);
  }

  const emailStr = String(workEmail).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
    return sendError(res, "Invalid work email format", 400);
  }

  const createdBy = req.id ?? null;

  const sql = `
    INSERT INTO sales_leads (full_name, work_email, company_name, company_size, phone_number, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const result = await q(sql, [
    String(fullName).trim(),
    emailStr,
    String(companyName).trim(),
    companySize && COMPANY_SIZE_OPTIONS.includes(companySize) ? companySize : null,
    phoneNumber ? String(phoneNumber).trim() : null,
    createdBy,
  ]);

  return sendSuccess(res, { id: result.insertId }, "Lead created successfully");
});

// Get lead list (role-based: admin/TL all, sales/employee own + NULL)
export const getLeadList = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { employeeId } = req.query;
  const userRole = req.role?.toLowerCase();
  let userId = req.id;
  if (userId == null && req.employeeId != null) {
    const empRows = await q("SELECT id FROM employee WHERE EMPID = ?", [req.employeeId]);
    if (empRows.length > 0) userId = empRows[0].id;
  }

  let sql = `
    SELECT l.*, e.employeeName as createdByName, e.EMPID as createdByEmpId
    FROM sales_leads l
    LEFT JOIN employee e ON l.created_by = e.id
    WHERE 1=1
  `;
  const params = [];

  const isSalesOrEmployee = userRole && (userRole === "employee" || userRole.includes("sales"));
  if (isSalesOrEmployee) {
    if (userId == null) {
      return sendSuccess(res, []);
    }
    sql += " AND (l.created_by = ? OR l.created_by IS NULL)";
    params.push(userId);
  } else if (userRole === "admin" || userRole === "tl" || userRole === "teamlead") {
    if (employeeId) {
      sql += " AND l.created_by = ?";
      params.push(employeeId);
    }
  }

  sql += " ORDER BY l.createdAt DESC";

  const results = await q(sql, params);
  return sendSuccess(res, results);
});

// Get lead by ID
export const getLeadById = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const rows = await q(
    "SELECT l.*, e.employeeName as createdByName FROM sales_leads l LEFT JOIN employee e ON l.created_by = e.id WHERE l.id = ?",
    [id]
  );
  if (rows.length === 0) return sendError(res, "Lead not found", 404);
  return sendSuccess(res, rows[0]);
});

// Update lead
export const updateLead = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const { fullName, workEmail, companyName, companySize, phoneNumber } = req.body;

  if (!fullName || !workEmail || !companyName) {
    return sendError(res, "Full Name, Work Email and Company Name are required", 400);
  }

  const emailStr = String(workEmail).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
    return sendError(res, "Invalid work email format", 400);
  }

  const sql = `
    UPDATE sales_leads
    SET full_name = ?, work_email = ?, company_name = ?, company_size = ?, phone_number = ?
    WHERE id = ?
  `;
  const result = await q(sql, [
    String(fullName).trim(),
    emailStr,
    String(companyName).trim(),
    companySize && COMPANY_SIZE_OPTIONS.includes(companySize) ? companySize : null,
    phoneNumber ? String(phoneNumber).trim() : null,
    id,
  ]);

  if (result.affectedRows === 0) return sendError(res, "Lead not found", 404);
  return sendSuccess(res, null, "Lead updated successfully");
});

// Delete lead
export const deleteLead = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const result = await q("DELETE FROM sales_leads WHERE id = ?", [id]);
  if (result.affectedRows === 0) return sendError(res, "Lead not found", 404);
  return sendSuccess(res, null, "Lead deleted successfully");
});

// Get company size options (for dropdown)
export const getCompanySizeOptions = asyncHandler(async (req, res) => {
  return sendSuccess(res, COMPANY_SIZE_OPTIONS);
});
