import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query, companyQuery } from "../config/database.js";
import config from "../config/index.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { checkUserAccessAllowed } from "./userAccessController.js";

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const isExEmployeeStatus = (employeeStatus) => {
  const s = normalizeStatus(employeeStatus);
  // Keep this intentionally strict to your request: block "ex-employee" variants.
  return s === "exemployee";
};

const blockIfExEmployee = (res, employeeStatus) => {
  if (isExEmployeeStatus(employeeStatus)) {
    return sendError(res, "Account is inactive (ex-employee). Contact HR/Admin.", 403);
  }
  return null;
};

export const adminLogin = asyncHandler(async (req, res) => {
  const { userName, password } = req.body;

  if (!userName || !password) {
    return sendError(res, "userName and password are required", 400);
  }

  // Try users table first, then employee table (for admin users in employee table)
  let sql = "SELECT * FROM users WHERE LOWER(userName) = LOWER(?)";
  let results = await query(sql, [userName.trim()]);
  let user = null;
  let isFromEmployeeTable = false;

  // If not found in users table, check employee table for Admin role
  let isCompanyUser = false;
  if (results.length === 0) {
    sql = "SELECT * FROM employee WHERE LOWER(userName) = LOWER(?) AND (role = 'Admin' OR role LIKE '%Admin%')";
    results = await query(sql, [userName.trim()]);
    if (results.length > 0) {
      user = results[0];
      isFromEmployeeTable = true;
    }
  } else {
    user = results[0];
  }

  // If an employee row exists with HR role but NOT Admin, do not authenticate via
  // company_users here: admin JWT always has role "admin", which breaks HR UI and
  // prevents Login.jsx cascade (admin → hr → …) from reaching hrLogin when the same
  // email/username exists in both employee (HR) and company_users.
  let skipCompanyUsersForHrEmployee = false;
  if (!user) {
    try {
      const hrOnlyRows = await query(
        `SELECT id FROM employee WHERE LOWER(userName) = LOWER(?)
         AND (role = 'HR' OR LOWER(role) LIKE '%hr%')
         AND NOT (role = 'Admin' OR role LIKE '%Admin%')`,
        [userName.trim()]
      );
      if (hrOnlyRows.length > 0) skipCompanyUsersForHrEmployee = true;
    } catch (e) {
      if (e?.code !== "ER_NO_SUCH_TABLE") throw e;
    }
  }

  // If still not found, try company_users (admin login for company; uses email as userName)
  if (!user && !skipCompanyUsersForHrEmployee) {
    try {
      const cuRows = await query(
        "SELECT * FROM company_users WHERE LOWER(email) = LOWER(?) AND is_active = 1 LIMIT 1",
        [userName.trim()]
      );
      if (cuRows.length > 0) {
        user = cuRows[0];
        isCompanyUser = true;
      }
    } catch (err) {
      if (err.code !== "ER_NO_SUCH_TABLE") throw err;
    }
  }

  if (!user) {
    console.log(`Admin login failed: User not found - userName: ${userName}`);
    return sendError(res, "Wrong userName or Password", 401);
  }

  // If logging in via employee table, block ex-employees
  if (isFromEmployeeTable) {
    const blocked = blockIfExEmployee(res, user.employeeStatus);
    if (blocked) return blocked;
  }

  // If logging in via company_users, also block ex-employees if an employee row exists
  if (isCompanyUser) {
    try {
      const em = String(user.email || userName || "").trim();
      if (em) {
        const empRows = await companyQuery(
          `SELECT employeeStatus FROM employee
           WHERE LOWER(TRIM(employeeEmail)) = LOWER(TRIM(?))
              OR LOWER(TRIM(userName)) = LOWER(TRIM(?))
           ORDER BY id DESC
           LIMIT 1`,
          [em, em]
        );
        const empStatus = empRows?.[0]?.employeeStatus;
        const blocked = blockIfExEmployee(res, empStatus);
        if (blocked) return blocked;
      }
    } catch (e) {
      // If tenant employee table isn't available, do not hard-fail company login here.
      if (e?.code !== "ER_NO_SUCH_TABLE") throw e;
    }
  }

  // Verify password - check if password is hashed or plaintext (company_users always hashed)
  let passwordValid = false;
  const passwordStr = String(password).trim();
  
  if (user.password && user.password.startsWith("$2b$")) {
    passwordValid = await bcrypt.compare(passwordStr, user.password);
    if (!passwordValid) {
      console.log(`Admin login failed: Password mismatch for user: ${userName}`);
    }
  } else {
    passwordValid = passwordStr === String(user.password).trim();
    if (!passwordValid) {
      console.log(`Admin login failed: Plaintext password mismatch for user: ${userName}`);
    }
  }

  if (!passwordValid) {
    return sendError(res, "Wrong userName or Password", 401);
  }

  // Company users are created by super admin; skip allowlist check
  if (!isCompanyUser) {
    const access = await checkUserAccessAllowed(user);
    if (!access.allowed) {
      return sendError(res, "Access not granted. Request access from admin.", 403);
    }
  }

  // Token payload: role "admin" so they get admin flow; add company_id and isCompanyUser for menu permissions
  const tokenPayload = {
    role: "admin",
    userName: isCompanyUser ? user.email : user.userName,
  };

  if (isFromEmployeeTable) {
    tokenPayload.id = user.id;
    tokenPayload.employeeName = user.employeeName;
    tokenPayload.employeeId = user.EMPID;
    tokenPayload.designation = user.designation;
    tokenPayload.dateOfJoining = user.date;
    tokenPayload.discipline = user.discipline;
    tokenPayload.employeeStatus = user.employeeStatus;
  } else if (isCompanyUser) {
    tokenPayload.company_id = user.company_id;
    tokenPayload.isCompanyUser = true;
    tokenPayload.company_user_id = user.id;
    tokenPayload.company_role = user.role || "company_user";
    // Matches Settings → Roles role_name in Menu Permissions (e.g. "Video Editor"); optional
    tokenPayload.company_menu_role = user.menu_role_name || null;

    // Link tenant employee row when company login email matches employeeEmail/userName
    const em = String(user.email || userName || "").trim();
    if (em) {
      try {
        const empRows = await companyQuery(
          `SELECT id, EMPID, employeeName, designation, date, discipline, employeeStatus
           FROM employee
           WHERE LOWER(TRIM(employeeEmail)) = LOWER(TRIM(?))
              OR LOWER(TRIM(userName)) = LOWER(TRIM(?))
           ORDER BY id DESC
           LIMIT 1`,
          [em, em]
        );
        if (empRows?.length) {
          const emp = empRows[0];
          tokenPayload.id = emp.id;
          tokenPayload.employeeId = emp.EMPID;
          tokenPayload.employeeName = emp.employeeName;
          tokenPayload.designation = emp.designation;
          tokenPayload.dateOfJoining = emp.date;
          tokenPayload.discipline = emp.discipline;
          tokenPayload.employeeStatus = emp.employeeStatus;
        }
      } catch (e) {
        if (e?.code !== "ER_NO_SUCH_TABLE") throw e;
      }
    }
  }

  const token = jwt.sign(tokenPayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return sendSuccess(res, { token }, "Login successful");
});

export const employeeLogin = asyncHandler(async (req, res) => {
  const { userName, password } = req.body;

  if (!userName || !password) {
    return sendError(res, "userName and password are required", 400);
  }

  // Case-insensitive username search - no role filter, accepts all roles from employee table
  const sql = "SELECT * FROM employee WHERE LOWER(userName) = LOWER(?)";
  const results = await query(sql, [userName.trim()]);

  if (results.length === 0) {
    console.log(`Employee login failed: User not found - userName: ${userName}`);
    return sendError(res, "Wrong Email or Password", 401);
  }

  const user = results[0];

  const blocked = blockIfExEmployee(res, user.employeeStatus);
  if (blocked) return blocked;

  // Verify password - check if password is hashed or plaintext
  let passwordValid = false;
  const passwordStr = String(password).trim();
  
  // Check if user has a password set
  if (!user.password || user.password === '' || user.password === null) {
    console.log(`Employee login failed: No password set for user: ${userName}, role: ${user.role}`);
    return sendError(res, "Password not set for this account", 401);
  }
  
  console.log(`Employee login attempt: userName=${userName}, role=${user.role}, hasPassword=${!!user.password}, passwordStartsWith$2b=${String(user.password).startsWith('$2b$')}`);
  
  if (String(user.password).startsWith("$2b$")) {
    // Password is hashed, use bcrypt compare
    try {
      passwordValid = await bcrypt.compare(passwordStr, String(user.password));
      console.log(`Employee login: bcrypt.compare result=${passwordValid} for user: ${userName}`);
      if (!passwordValid) {
        console.log(`Employee login failed: Password mismatch (bcrypt) for user: ${userName}`);
      } else {
        console.log(`Employee login success: Password verified (bcrypt) for user: ${userName}, role: ${user.role}`);
      }
    } catch (error) {
      console.error(`Employee login error during bcrypt compare: ${error.message}`, error);
      passwordValid = false;
    }
  } else {
    // Password is plaintext (legacy), compare directly
    const dbPassword = String(user.password).trim();
    passwordValid = passwordStr === dbPassword;
    console.log(`Employee login: plaintext comparison - input: "${passwordStr}", db: "${dbPassword}", match: ${passwordValid}`);
    if (!passwordValid) {
      console.log(`Employee login failed: Plaintext password mismatch for user: ${userName}`);
    } else {
      console.log(`Employee login success: Password verified (plaintext) for user: ${userName}, role: ${user.role}`);
    }
  }

  if (!passwordValid) {
    return sendError(res, "Wrong Email or Password", 401);
  }

  const access = await checkUserAccessAllowed(user);
  if (!access.allowed) {
    return sendError(res, "Access not granted. Request access from admin.", 403);
  }

  const token = jwt.sign(
    {
      role: user.role,
      id: user?.id,
      userName: user.userName,
      employeeName: user.employeeName,
      employeeId: user.EMPID,
      designation: user.designation,
      dateOfJoining: user.date,
      discipline: user.discipline,
      employeeStatus: user.employeeStatus,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return sendSuccess(res, { tokensss: token }, "Login successful");
});

export const teamLeadLogin = asyncHandler(async (req, res) => {
  const { userName, password } = req.body;

  if (!userName || !password) {
    return sendError(res, "userName and password are required", 400);
  }

  // Try team_lead table first, then employee table (for TL users in employee table)
  let sql = "SELECT * FROM team_lead WHERE LOWER(userName) = LOWER(?)";
  let results = await query(sql, [userName.trim()]);
  let teamLead = null;
  let isFromEmployeeTable = false;

  // If not found in team_lead table, check employee table for TL role
  if (results.length === 0) {
    sql = "SELECT * FROM employee WHERE LOWER(userName) = LOWER(?) AND (role = 'TL' OR role = 'TeamLead' OR role LIKE '%TL%' OR role LIKE '%TeamLead%')";
    results = await query(sql, [userName.trim()]);
    if (results.length > 0) {
      teamLead = results[0];
      isFromEmployeeTable = true;
      console.log(`TeamLead login: Found user in employee table - userName: ${userName}, role: ${teamLead.role}`);
    }
  } else {
    teamLead = results[0];
    console.log(`TeamLead login: Found user in team_lead table - userName: ${userName}`);
  }

  if (!teamLead) {
    console.log(`TeamLead login failed: User not found - userName: ${userName}`);
    return sendError(res, "Wrong userName or Password", 401);
  }

  if (isFromEmployeeTable) {
    const blocked = blockIfExEmployee(res, teamLead.employeeStatus);
    if (blocked) return blocked;
  }

  if (!teamLead.password) {
    console.log(`TeamLead login failed: No password set for user: ${userName}`);
    return sendError(res, "Password not set for this account", 401);
  }

  // Verify password - check if password is hashed or plaintext
  let passwordValid = false;
  const passwordStr = String(password).trim();
  
  console.log(`TeamLead login attempt: userName=${userName}, role=${teamLead.role}, hasPassword=${!!teamLead.password}, passwordStartsWith$2b=${teamLead.password?.startsWith('$2b$')}`);
  
  if (teamLead.password && teamLead.password.startsWith("$2b$")) {
    // Password is hashed, use bcrypt compare
    try {
      passwordValid = await bcrypt.compare(passwordStr, teamLead.password);
      if (!passwordValid) {
        console.log(`TeamLead login failed: Password mismatch (bcrypt) for user: ${userName}`);
      } else {
        console.log(`TeamLead login success: Password verified (bcrypt) for user: ${userName}`);
      }
    } catch (error) {
      console.error(`TeamLead login error during bcrypt compare: ${error.message}`);
      passwordValid = false;
    }
  } else {
    // Password is plaintext (legacy), compare directly
    passwordValid = passwordStr === String(teamLead.password).trim();
    if (!passwordValid) {
      console.log(`TeamLead login failed: Plaintext password mismatch for user: ${userName}`);
    } else {
      console.log(`TeamLead login success: Password verified (plaintext) for user: ${userName}`);
    }
  }

  if (!passwordValid) {
    return sendError(res, "Wrong userName or Password", 401);
  }

  const access = await checkUserAccessAllowed(teamLead);
  if (!access.allowed) {
    return sendError(res, "Access not granted. Request access from admin.", 403);
  }

  // Include additional user data if from employee table
  const tokenPayload = {
    role: "teamLead",
    id: teamLead.id,
    userName: teamLead.userName,
  };

  if (isFromEmployeeTable) {
    tokenPayload.tlName = teamLead.employeeName;
    tokenPayload.employeeName = teamLead.employeeName;
    tokenPayload.employeeId = teamLead.EMPID;
    tokenPayload.designation = teamLead.designation;
    tokenPayload.dateOfJoining = teamLead.date;
    tokenPayload.discipline = teamLead.discipline;
    tokenPayload.employeeStatus = teamLead.employeeStatus;
  } else {
    tokenPayload.tlName = teamLead.leadName;
  }

  const token = jwt.sign(tokenPayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return sendSuccess(res, { id: teamLead.id, token }, "Login successful");
});

export const hrLogin = asyncHandler(async (req, res) => {
  const { userName, password } = req.body;

  if (!userName || !password) {
    return sendError(res, "userName and password are required", 400);
  }

  // Try hr table first, then employee table (for HR users in employee table)
  let sql = "SELECT * FROM hr WHERE LOWER(userName) = LOWER(?)";
  let results = await query(sql, [userName.trim()]);
  let hr = null;
  let isFromEmployeeTable = false;

  // If not found in hr table, check employee table for HR role
  if (results.length === 0) {
    sql = "SELECT * FROM employee WHERE LOWER(userName) = LOWER(?) AND (role = 'HR' OR role LIKE '%HR%')";
    results = await query(sql, [userName.trim()]);
    if (results.length > 0) {
      hr = results[0];
      isFromEmployeeTable = true;
      console.log(`HR login: Found user in employee table - userName: ${userName}, role: ${hr.role}`);
    }
  } else {
    hr = results[0];
    console.log(`HR login: Found user in hr table - userName: ${userName}`);
  }

  if (!hr) {
    console.log(`HR login failed: User not found - userName: ${userName}`);
    return sendError(res, "Wrong Email or Password", 401);
  }

  if (isFromEmployeeTable) {
    const blocked = blockIfExEmployee(res, hr.employeeStatus);
    if (blocked) return blocked;
  }

  if (!hr.password) {
    console.log(`HR login failed: No password set for user: ${userName}`);
    return sendError(res, "Password not set for this account", 401);
  }

  // Verify password - check if password is hashed or plaintext
  let passwordValid = false;
  const passwordStr = String(password).trim();
  
  console.log(`HR login attempt: userName=${userName}, role=${hr.role}, hasPassword=${!!hr.password}, passwordStartsWith$2b=${hr.password?.startsWith('$2b$')}`);
  
  if (hr.password && hr.password.startsWith("$2b$")) {
    // Password is hashed, use bcrypt compare
    try {
      passwordValid = await bcrypt.compare(passwordStr, hr.password);
      if (!passwordValid) {
        console.log(`HR login failed: Password mismatch (bcrypt) for user: ${userName}`);
      } else {
        console.log(`HR login success: Password verified (bcrypt) for user: ${userName}`);
      }
    } catch (error) {
      console.error(`HR login error during bcrypt compare: ${error.message}`);
      passwordValid = false;
    }
  } else {
    // Password is plaintext (legacy), compare directly
    passwordValid = passwordStr === String(hr.password).trim();
    if (!passwordValid) {
      console.log(`HR login failed: Plaintext password mismatch for user: ${userName}`);
    } else {
      console.log(`HR login success: Password verified (plaintext) for user: ${userName}`);
    }
  }

  if (!passwordValid) {
    return sendError(res, "Wrong userName or Password", 401);
  }

  const access = await checkUserAccessAllowed(hr);
  if (!access.allowed) {
    return sendError(res, "Access not granted. Request access from admin.", 403);
  }

  // Include additional user data if from employee table
  const tokenPayload = {
    role: "hr",
    id: hr.id,
    userName: hr.userName,
  };

  if (isFromEmployeeTable) {
    tokenPayload.hrName = hr.employeeName;
    tokenPayload.employeeName = hr.employeeName;
    tokenPayload.employeeId = hr.EMPID;
    tokenPayload.designation = hr.designation;
    tokenPayload.dateOfJoining = hr.date;
    tokenPayload.discipline = hr.discipline;
    tokenPayload.employeeStatus = hr.employeeStatus;
  } else {
    tokenPayload.hrName = hr.hrName;
  }

  const token = jwt.sign(tokenPayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return sendSuccess(res, { id: hr.id, token }, "Login successful");
});

export const dashboard = asyncHandler(async (req, res) => {
  let company_name = null;
  let company_code = null;
  let employee_table_role = null;
  if (req.company_id) {
    try {
      const c = await query("SELECT company_name, company_code FROM companies WHERE id = ? LIMIT 1", [
        Number(req.company_id),
      ]);
      if (c?.length) {
        company_name = c[0].company_name;
        company_code = c[0].company_code;
      }
    } catch (e) {
      if (e?.code !== "ER_NO_SUCH_TABLE") throw e;
    }
  }
  // For company logins, also expose matching employee.role so UI can show actual role label
  // (e.g. Video Editor) instead of generic "Company user".
  if (req.isCompanyUser && req.userName) {
    const em = String(req.userName).trim();
    const roleLookupSql = `
      SELECT role
      FROM employee
      WHERE LOWER(TRIM(employeeEmail)) = LOWER(TRIM(?))
         OR LOWER(TRIM(userName)) = LOWER(TRIM(?))
      ORDER BY id DESC
      LIMIT 1
    `;
    // Try tenant DB first (company login data), then fallback to primary DB.
    try {
      const erTenant = await companyQuery(roleLookupSql, [em, em]);
      employee_table_role = erTenant?.[0]?.role || null;
    } catch {
      // ignore and fallback
    }
    if (!employee_table_role) {
      try {
        const erPrimary = await query(roleLookupSql, [em, em]);
        employee_table_role = erPrimary?.[0]?.role || null;
      } catch (e) {
        if (e?.code !== "ER_NO_SUCH_TABLE") throw e;
      }
    }
  }

  let employeeImage = null;
  let dashboardEmployeeName =
    req.employeeName != null && String(req.employeeName).trim() !== ""
      ? String(req.employeeName).trim()
      : null;

  let employeeRecordId =
    req.id != null && req.id !== "" ? Number(req.id) : null;
  if (employeeRecordId != null && Number.isNaN(employeeRecordId)) employeeRecordId = null;

  if (req.id) {
    try {
      const qfn = req.isCompanyUser ? companyQuery : query;
      const rows = await qfn(
        "SELECT employeeName, employeeImage FROM employee WHERE id = ? LIMIT 1",
        [req.id]
      );
      const r = rows?.[0];
      if (r) {
        const img = r.employeeImage != null ? String(r.employeeImage).trim() : "";
        if (img && img !== "default-image-filename.jpg") employeeImage = img;
        if (!dashboardEmployeeName && r.employeeName) {
          const n = String(r.employeeName).trim();
          if (n) dashboardEmployeeName = n;
        }
      }
    } catch (e) {
      if (e?.code !== "ER_NO_SUCH_TABLE") throw e;
    }
  }

  // Company portal JWT has no employee id; always resolve name + photo from tenant employee row by login email.
  if (req.isCompanyUser && req.userName) {
    const em = String(req.userName).trim();
    const imgSql = `SELECT id, employeeName, employeeImage FROM employee
      WHERE LOWER(TRIM(employeeEmail)) = LOWER(TRIM(?)) OR LOWER(TRIM(userName)) = LOWER(TRIM(?))
      ORDER BY id DESC LIMIT 1`;
    let row = null;
    try {
      const t = await companyQuery(imgSql, [em, em]);
      if (t?.length) row = t[0];
    } catch {
      // ignore
    }
    if (!row) {
      try {
        const p = await query(imgSql, [em, em]);
        if (p?.length) row = p[0];
      } catch (e) {
        if (e?.code !== "ER_NO_SUCH_TABLE") throw e;
      }
    }
    if (row) {
      const rid = row.id != null ? Number(row.id) : null;
      if (rid != null && !Number.isNaN(rid)) employeeRecordId = rid;
      const img = row.employeeImage != null ? String(row.employeeImage).trim() : "";
      if (img && img !== "default-image-filename.jpg") employeeImage = img;
      const n = row.employeeName != null ? String(row.employeeName).trim() : "";
      if (n) dashboardEmployeeName = n;
    }
  }

  return sendSuccess(res, {
    role: req.role,
    id: req.id,
    employeeRecordId: employeeRecordId ?? null,
    employeeId: req.employeeId,
    userName: req.userName,
    employeeName: dashboardEmployeeName,
    employeeImage,
    designation: req.designation,
    dateOfJoining: req.dateOfJoining,
    discipline: req.discipline,
    employeeStatus: req.employeeStatus,
    isCompanyUser: !!req.isCompanyUser,
    company_id: req.company_id ?? null,
    company_user_id: req.company_user_id ?? null,
    company_role: req.company_role ?? null,
    company_menu_role: req.company_menu_role ?? null,
    employee_table_role,
    company_name,
    company_code,
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  return sendSuccess(res, null, "Logout successful");
});

