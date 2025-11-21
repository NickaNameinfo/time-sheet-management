import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../config/database.js";
import config from "../config/index.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const adminLogin = asyncHandler(async (req, res) => {
  const { userName, password } = req.body;

  const sql = "SELECT * FROM users WHERE userName = ? AND password = ?";
  const results = await query(sql, [userName, password]);

  if (results.length === 0) {
    return sendError(res, "Wrong userName or Password", 401);
  }

  const token = jwt.sign(
    { role: "admin", userName: results[0].userName },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return sendSuccess(res, { token }, "Login successful");
});

export const employeeLogin = asyncHandler(async (req, res) => {
  const { userName, password } = req.body;

  const sql = "SELECT * FROM employee WHERE userName = ?";
  const results = await query(sql, [userName]);

  if (results.length === 0) {
    return sendError(res, "Wrong Email or Password", 401);
  }

  const user = results[0];

  // Verify password - check if password is hashed or plaintext
  let passwordValid = false;
  if (user.password && user.password.startsWith("$2b$")) {
    // Password is hashed, use bcrypt compare
    passwordValid = await bcrypt.compare(password.toString(), user.password);
  } else {
    // Password is plaintext (legacy), compare directly
    passwordValid = String(password) === String(user.password);
  }

  if (!passwordValid) {
    return sendError(res, "Wrong Email or Password", 401);
  }

  const token = jwt.sign(
    {
      role: user.role,
      id: user.id,
      userName: user.userName,
      employeeName: user.employeeName,
      employeeId: user.EMPID,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return sendSuccess(res, { tokensss: token }, "Login successful");
});

export const teamLeadLogin = asyncHandler(async (req, res) => {
  const { userName, password } = req.body;

  const sql = "SELECT * FROM team_lead WHERE userName = ?";
  const results = await query(sql, [userName]);

  if (results.length === 0) {
    return sendError(res, "Wrong userName or Password", 401);
  }

  const teamLead = results[0];

  if (!teamLead.password) {
    return sendError(res, "Password not set for this account", 401);
  }

  const passwordValid = await bcrypt.compare(
    password.toString(),
    teamLead.password
  );

  if (!passwordValid) {
    return sendError(res, "Wrong userName or Password", 401);
  }

  const token = jwt.sign(
    {
      role: "teamLead",
      id: teamLead.id,
      userName: teamLead.userName,
      tlName: teamLead.leadName,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return sendSuccess(res, { id: teamLead.id, token }, "Login successful");
});

export const hrLogin = asyncHandler(async (req, res) => {
  const { userName, password } = req.body;

  const sql = "SELECT * FROM hr WHERE userName = ?";
  const results = await query(sql, [userName]);

  if (results.length === 0) {
    return sendError(res, "Wrong Email or Password", 401);
  }

  const hr = results[0];

  if (!hr.password) {
    return sendError(res, "Password not set for this account", 401);
  }

  const passwordValid = await bcrypt.compare(
    password.toString(),
    hr.password
  );

  if (!passwordValid) {
    return sendError(res, "Wrong userName or Password", 401);
  }

  const token = jwt.sign(
    {
      role: "hr",
      id: hr.id,
      userName: hr.userName,
      hrName: hr.hrName,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

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
    employeeName: req?.employeeName,
    tlName: req?.tlName,
    hrName: req?.hrName,
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  return sendSuccess(res, null, "Logout successful");
});

