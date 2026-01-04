import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../config/database.js";
import config from "../config/index.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

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

  if (!user) {
    console.log(`Admin login failed: User not found - userName: ${userName}`);
    return sendError(res, "Wrong userName or Password", 401);
  }

  // Verify password - check if password is hashed or plaintext
  let passwordValid = false;
  const passwordStr = String(password).trim();
  
  if (user.password && user.password.startsWith("$2b$")) {
    // Password is hashed, use bcrypt compare
    passwordValid = await bcrypt.compare(passwordStr, user.password);
    if (!passwordValid) {
      console.log(`Admin login failed: Password mismatch for user: ${userName}`);
    }
  } else {
    // Password is plaintext (legacy), compare directly
    passwordValid = passwordStr === String(user.password).trim();
    if (!passwordValid) {
      console.log(`Admin login failed: Plaintext password mismatch for user: ${userName}`);
    }
  }

  if (!passwordValid) {
    return sendError(res, "Wrong userName or Password", 401);
  }

  // Include additional user data if from employee table
  const tokenPayload = {
    role: "admin",
    userName: user.userName,
  };

  if (isFromEmployeeTable) {
    tokenPayload.id = user.id;
    tokenPayload.employeeName = user.employeeName;
    tokenPayload.employeeId = user.EMPID;
    tokenPayload.designation = user.designation;
    tokenPayload.dateOfJoining = user.date;
    tokenPayload.discipline = user.discipline;
    tokenPayload.employeeStatus = user.employeeStatus;
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
  return sendSuccess(res, {
    role: req.role,
    id: req.id,
    employeeId: req.employeeId,
    userName: req.userName,
    employeeName: req.employeeName,
    designation: req.designation,
    dateOfJoining: req.dateOfJoining,
    discipline: req.discipline,
    employeeStatus: req.employeeStatus,
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  return sendSuccess(res, null, "Logout successful");
});

