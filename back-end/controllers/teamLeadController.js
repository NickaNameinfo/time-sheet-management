import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const createTeamLead = asyncHandler(async (req, res) => {
  const sql =
    "INSERT INTO team_lead (`leadName`,`teamName`, `EMPID`) VALUES (?)";
  const values = [req.body.leadName, req.body.teamName, req.body.EMPID];

  await query(sql, [values]);
  return sendSuccess(res, null, "Team lead created successfully");
});

export const getTeamLeads = asyncHandler(async (req, res) => {
  const sql = "SELECT * FROM team_lead";
  const results = await query(sql);
  return sendSuccess(res, results);
});

export const deleteTeamLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM team_lead WHERE id = ?";
  await query(sql, [id]);
  return sendSuccess(res, null, "Team lead deleted successfully");
});

