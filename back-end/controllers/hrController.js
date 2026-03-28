import bcrypt from "bcrypt";
import { getTenantQuery } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const createHr = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { userName } = req.body;

  // Check if userName already exists
  const checkSql = "SELECT COUNT(*) AS count FROM hr WHERE `userName` = ?";
  const checkResult = await q(checkSql, [userName]);

  if (checkResult[0].count > 0) {
    return sendError(res, "userName already exists", 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(req.body.password.toString(), 10);

  const sql = "INSERT INTO hr (`hrName`,`userName`,`password`) VALUES (?)";
  const values = [req.body.hrName, req.body.userName, hashedPassword];

  await q(sql, [values]);
  return sendSuccess(res, null, "HR created successfully");
});

export const getHr = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const sql = "SELECT * FROM hr";
  const results = await q(sql);
  return sendSuccess(res, results);
});

export const deleteHr = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const sql = "DELETE FROM hr WHERE id = ?";
  await q(sql, [id]);
  return sendSuccess(res, null, "HR deleted successfully");
});

