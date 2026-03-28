import { getTenantQuery } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const createTeamLead = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const sql =
    "INSERT INTO team_lead (`leadName`,`teamName`, `EMPID`) VALUES (?)";
  const values = [req.body.leadName, req.body.teamName, req.body.EMPID];

  await q(sql, [values]);
  return sendSuccess(res, null, "Team lead created successfully");
});

export const getTeamLeads = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const sql = "SELECT * FROM team_lead";
  const results = await q(sql);
  return sendSuccess(res, results);
});

export const deleteTeamLead = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const sql = "DELETE FROM team_lead WHERE id = ?";
  await q(sql, [id]);
  return sendSuccess(res, null, "Team lead deleted successfully");
});

