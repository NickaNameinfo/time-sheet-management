import bcrypt from "bcrypt";
import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const createEmployee = asyncHandler(async (req, res) => {
  const { userName } = req.body;

  // Check if userName already exists
  const checkSql = "SELECT COUNT(*) AS count FROM employee WHERE `userName` = ?";
  const checkResult = await query(checkSql, [userName]);

  if (checkResult[0].count > 0) {
    return sendError(res, "userName already exists", 409);
  }

  // Hash password if provided
  let hashedPassword = req.body.password;
  if (req.body.password) {
    hashedPassword = await bcrypt.hash(req.body.password.toString(), 10);
  }

  const imageFilename = req.file
    ? req.file.filename
    : req.body.employeeImage || "default-image-filename.jpg";

  const sql =
    "INSERT INTO employee (`employeeName`, `EMPID`, `employeeEmail`, `userName`, `password`, `role`, `discipline`, `designation`, `date`, `employeeImage`, `employeeStatus`, `relievingDate`, `permanentDate`) VALUES (?)";

  const values = [
    req.body.employeeName,
    req.body.EMPID,
    req.body.employeeEmail,
    req.body.userName,
    hashedPassword,
    req.body.role?.toString(),
    req.body.discipline,
    req.body.designation,
    req.body.date,
    imageFilename,
    req.body.employeeStatus,
    req.body.relievingDate,
    req.body.permanentDate,
  ];

  await query(sql, [values]);
  return sendSuccess(res, null, "Employee created successfully");
});

export const getEmployees = asyncHandler(async (req, res) => {
  const sql = "SELECT * FROM employee";
  const results = await query(sql);
  return sendSuccess(res, results);
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM employee WHERE id = ?";
  const results = await query(sql, [id]);

  if (results.length === 0) {
    return sendError(res, "Employee not found", 404);
  }

  return sendSuccess(res, results[0]);
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userName } = req.body;

  // Check if userName already exists for a different employee
  const checkSql =
    "SELECT COUNT(*) AS count FROM employee WHERE `userName` = ? AND `id` <> ?";
  const checkResult = await query(checkSql, [userName, id]);

  if (checkResult[0].count > 0) {
    return sendError(res, "userName already exists", 409);
  }

  let updateSql =
    "UPDATE employee SET `employeeName`=?, `EMPID`=?, `employeeEmail`=?, `userName`=?";
  const values = [
    req.body.employeeName,
    req.body.EMPID,
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

  if (req.body.discipline) {
    updateSql += ", `discipline`=?";
    values.push(req.body.discipline);
  }

  if (req.body.designation) {
    updateSql += ", `designation`=?";
    values.push(req.body.designation);
  }

  if (req.body.date) {
    updateSql += ", `date`=?";
    values.push(req.body.date);
  }

  if (req.file || req.body.employeeImage) {
    updateSql += ", `employeeImage`=?";
    values.push(req.file ? req.file.filename : req.body.employeeImage);
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

  updateSql += " WHERE `id`=?";
  values.push(id);

  await query(updateSql, values);
  return sendSuccess(res, null, "Employee updated successfully");
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM employee WHERE id = ?";
  await query(sql, [id]);
  return sendSuccess(res, null, "Employee deleted successfully");
});

export const getEmployeeCount = asyncHandler(async (req, res) => {
  const sql = "SELECT count(id) as employee FROM employee";
  const results = await query(sql);
  return sendSuccess(res, results[0]);
});

