import bcrypt from "bcrypt";
import { getTenantQuery, query as primaryQuery } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

function normalizeEmailKey(email) {
  return (email || "").toString().trim().toLowerCase();
}

/**
 * company_users (primary DB) lists Super Admin–managed company logins.
 * Match employee.employeeEmail to show approved vs not on the employee grid.
 */
async function fetchCompanyLoginInfoByCompanyId(companyId) {
  const cid = Number(companyId);
  if (!cid || Number.isNaN(cid)) return null;
  try {
    const rows = await primaryQuery(
      `SELECT cu.email, cu.is_active,
        CASE WHEN cu.created_at = (
          SELECT MIN(cu2.created_at) FROM company_users cu2 WHERE cu2.company_id = cu.company_id
        ) THEN 'super_admin_created' ELSE 'company_created' END AS created_source
       FROM company_users cu
       WHERE cu.company_id = ?`,
      [cid]
    );
    const map = new Map();
    for (const r of rows || []) {
      const key = normalizeEmailKey(r.email);
      if (!key) continue;
      map.set(key, {
        is_active: r.is_active === 1 || r.is_active === true,
        created_source: r.created_source,
      });
    }
    return map;
  } catch (err) {
    if (err?.code === "ER_NO_SUCH_TABLE" || err?.code === "ER_BAD_DB_ERROR") return null;
    throw err;
  }
}

function enrichEmployeeWithCompanyLogin(row, loginMap) {
  if (!loginMap) {
    return { ...row, company_login_status: null, company_login_detail: null };
  }
  const key = normalizeEmailKey(row.employeeEmail);
  if (!key) {
    return { ...row, company_login_status: "none", company_login_detail: "no_email" };
  }
  const info = loginMap.get(key);
  if (!info) {
    return { ...row, company_login_status: "none", company_login_detail: "not_in_company_logins" };
  }
  if (!info.is_active) {
    return { ...row, company_login_status: "inactive", company_login_detail: "login_disabled" };
  }
  const fromSuperAdmin = info.created_source === "super_admin_created";
  return {
    ...row,
    company_login_status: fromSuperAdmin ? "approved_super_admin" : "approved_company",
    company_login_detail: fromSuperAdmin ? "first_company_login" : "company_added_login",
  };
}

/**
 * EMPID may be numeric or alphanumeric (e.g. NN001). DB column should be VARCHAR — INT coerced non-numeric to 0.
 * When missing or numeric ≤0, fall back to primary key `id` as string.
 */
function normalizeEmpIdValue(empId, rowId) {
  if (empId === undefined || empId === null) {
    return rowId != null ? String(rowId) : null;
  }
  const s = String(empId).trim();
  if (s === "") {
    return rowId != null ? String(rowId) : null;
  }
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    if (Number.isNaN(n) || n <= 0) {
      return rowId != null ? String(rowId) : null;
    }
    return s;
  }
  return s;
}

/** Only auto-fill EMPID on create when user did not provide a real code (empty or numeric 0). Alphanumeric codes are kept. */
function shouldDefaultEmpIdOnCreate(empId) {
  if (empId === undefined || empId === null) return true;
  const s = String(empId).trim();
  if (s === "") return true;
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    return Number.isNaN(n) || n <= 0;
  }
  return false;
}

/** DB column `discipline` is NOT NULL — use empty string when omitted. */
function disciplineOrEmpty(value) {
  if (value == null || value === "") return "";
  const s = String(value).trim();
  return s;
}

export const createEmployee = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { userName } = req.body;

  // Check if userName already exists
  const checkSql = "SELECT COUNT(*) AS count FROM employee WHERE `userName` = ?";
  const checkResult = await q(checkSql, [userName]);

  if (checkResult[0].count > 0) {
    return sendError(res, "userName already exists", 409);
  }

  // Hash password if provided
  let hashedPassword = req.body.password;
  if (req.body.password) {
    hashedPassword = await bcrypt.hash(req.body.password.toString(), 10);
  }

  const imageFilename = req.files?.employeeImage
    ? req.files.employeeImage[0].filename
    : req.body.employeeImage || "default-image-filename.jpg";

  const idProofFilename = req.files?.id_proof
    ? req.files.id_proof[0].filename
    : req.body.id_proof || null;

  const sql =
    "INSERT INTO employee (`employeeName`, `EMPID`, `employeeEmail`, `userName`, `password`, `role`, `discipline`, `designation`, `date`, `employeeImage`, `id_proof`, `employeeStatus`, `relievingDate`, `permanentDate`, `salary`, `father_name`, `mother_name`, `parent_contact`, `parent_address`) VALUES (?)";

  const values = [
    req.body.employeeName,
    req.body.EMPID,
    req.body.employeeEmail,
    req.body.userName,
    hashedPassword,
    req.body.role?.toString(),
    disciplineOrEmpty(req.body.discipline),
    req.body.designation,
    req.body.date,
    imageFilename,
    idProofFilename,
    req.body.employeeStatus,
    req.body.relievingDate,
    req.body.permanentDate,
    req.body.salary || null,
    req.body.father_name || null,
    req.body.mother_name || null,
    req.body.parent_contact || null,
    req.body.parent_address || null,
  ];

  const insertResult = await q(sql, [values]);
  const insertId = insertResult?.insertId;
  if (insertId && shouldDefaultEmpIdOnCreate(req.body.EMPID)) {
    await q("UPDATE employee SET `EMPID` = ? WHERE `id` = ?", [String(insertId), insertId]);
  }

  return sendSuccess(res, null, "Employee created successfully");
});

export const getEmployees = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const sql = "SELECT * FROM employee";
  const results = await q(sql);
  const loginMap =
    req.company_id != null && req.company_id !== ""
      ? await fetchCompanyLoginInfoByCompanyId(req.company_id)
      : null;

  const normalized = (results || []).map((row) => {
    const base = {
      ...row,
      EMPID: normalizeEmpIdValue(row.EMPID, row.id) ?? row.EMPID,
    };
    return enrichEmployeeWithCompanyLogin(base, loginMap);
  });
  return sendSuccess(res, normalized);
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const sql = "SELECT * FROM employee WHERE id = ?";
  const results = await q(sql, [id]);

  if (results.length === 0) {
    return sendError(res, "Employee not found", 404);
  }

  const row = results[0];
  const loginMap =
    req.company_id != null && req.company_id !== ""
      ? await fetchCompanyLoginInfoByCompanyId(req.company_id)
      : null;
  const base = {
    ...row,
    EMPID: normalizeEmpIdValue(row.EMPID, row.id) ?? row.EMPID,
  };
  const normalized = enrichEmployeeWithCompanyLogin(base, loginMap);
  return sendSuccess(res, normalized);
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const { userName } = req.body;

  // Check if userName already exists for a different employee
  const checkSql =
    "SELECT COUNT(*) AS count FROM employee WHERE `userName` = ? AND `id` <> ?";
  const checkResult = await q(checkSql, [userName, id]);

  if (checkResult[0].count > 0) {
    return sendError(res, "userName already exists", 409);
  }

  const empidForUpdate = normalizeEmpIdValue(req.body.EMPID, id);

  let updateSql =
    "UPDATE employee SET `employeeName`=?, `EMPID`=?, `employeeEmail`=?, `userName`=?";
  const values = [
    req.body.employeeName,
    empidForUpdate,
    req.body.employeeEmail,
    req.body.userName,
  ];

  // Hash password if provided
  if (req.body.password) {
    const hashedPassword = await bcrypt.hash(req.body.password.toString(), 10);
    updateSql += ", `password`=?";
    values.push(hashedPassword);
  }

  // Add optional fields
  if (req.body.role) {
    updateSql += ", `role`=?";
    values.push(req.body.role.toString());
  }

  if (req.body.discipline !== undefined) {
    updateSql += ", `discipline`=?";
    values.push(disciplineOrEmpty(req.body.discipline));
  }

  if (req.body.designation) {
    updateSql += ", `designation`=?";
    values.push(req.body.designation);
  }

  if (req.body.date) {
    updateSql += ", `date`=?";
    values.push(req.body.date);
  }

  if (req.files?.employeeImage || req.body.employeeImage) {
    updateSql += ", `employeeImage`=?";
    values.push(req.files?.employeeImage ? req.files.employeeImage[0].filename : req.body.employeeImage);
  }

  if (req.files?.id_proof || req.body.id_proof) {
    updateSql += ", `id_proof`=?";
    values.push(req.files?.id_proof ? req.files.id_proof[0].filename : req.body.id_proof);
  }

  if (req.body.employeeStatus) {
    updateSql += ", `employeeStatus`=?";
    values.push(req.body.employeeStatus);
  }

  if (req.body.relievingDate) {
    updateSql += ", `relievingDate`=?";
    values.push(req.body.relievingDate);
  }

  if (req.body.permanentDate) {
    updateSql += ", `permanentDate`=?";
    values.push(req.body.permanentDate);
  }

  if (req.body.salary !== undefined) {
    updateSql += ", `salary`=?";
    values.push(req.body.salary || null);
  }

  if (req.body.father_name !== undefined) {
    updateSql += ", `father_name`=?";
    values.push(req.body.father_name || null);
  }

  if (req.body.mother_name !== undefined) {
    updateSql += ", `mother_name`=?";
    values.push(req.body.mother_name || null);
  }

  if (req.body.parent_contact !== undefined) {
    updateSql += ", `parent_contact`=?";
    values.push(req.body.parent_contact || null);
  }

  if (req.body.parent_address !== undefined) {
    updateSql += ", `parent_address`=?";
    values.push(req.body.parent_address || null);
  }

  updateSql += " WHERE `id`=?";
  values.push(id);

  await q(updateSql, values);
  return sendSuccess(res, null, "Employee updated successfully");
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const sql = "DELETE FROM employee WHERE id = ?";
  await q(sql, [id]);
  return sendSuccess(res, null, "Employee deleted successfully");
});

export const getEmployeeCount = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const sql = "SELECT count(id) as employee FROM employee";
  const results = await q(sql);
  return sendSuccess(res, results[0]);
});

