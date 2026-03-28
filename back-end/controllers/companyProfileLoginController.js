import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Returns the current company (company admin/user) login emails (company_admin + company_user).
// This is safe for company accounts (tenant) because it filters using req.company_id.
export const getMyCompanyLoginEmails = asyncHandler(async (req, res) => {
  // Prefer company_id from JWT
  let companyId = req.company_id ? Number(req.company_id) : null;

  // Fallback: if token only has company_user_id, resolve company_id from company_users
  if (!companyId && req.company_user_id) {
    const rows = await query("SELECT company_id FROM company_users WHERE id = ? LIMIT 1", [
      Number(req.company_user_id),
    ]);
    companyId = rows?.[0]?.company_id ? Number(rows[0].company_id) : null;
  }

  if (!companyId) {
    // If token payload is missing company context, return empty list (UI fallback).
    return sendSuccess(res, []);
  }

  try {
    const rows = await query(
      `SELECT email, role, is_active
       FROM company_users
       WHERE company_id = ?
       ORDER BY role ASC, email ASC`,
      [companyId]
    );

    if (process.env.NODE_ENV === "development") {
      console.log("[getMyCompanyLoginEmails]", {
        companyId,
        company_user_id: req.company_user_id,
        userName: req.userName,
        count: Array.isArray(rows) ? rows.length : null,
      });
    }

    // Normalize shape for frontend
    const emails = (Array.isArray(rows) ? rows : []).map((r) => ({
      email: r.email,
      role: r.role,
    }));

    return sendSuccess(res, emails);
  } catch (err) {
    // If tables are not ready/migrated yet, don't crash the UI
    if (err?.code === "ER_NO_SUCH_TABLE" || err?.code === "ER_BAD_DB_ERROR") {
      return sendSuccess(res, []);
    }
    throw err;
  }
});

