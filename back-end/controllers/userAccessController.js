import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const USER_ACCESS_MODE_KEY = "user_access_mode";
const USER_ACCESS_ALLOWED_KEY_EXPORT = "user_access_allowed_emails";

/** Get user's email from login user record (employee/hr/tl/users table). */
export function getUserEmailForAccess(user) {
  const e = (user?.employeeEmail || user?.email || "").toString().trim().toLowerCase();
  if (e) return e;
  const u = (user?.userName || "").toString().trim().toLowerCase();
  return u && u.includes("@") ? u : "";
}

/** Super admin emails always have access regardless of allowlist. */
const SUPER_ADMIN_EMAILS_KEY = "super_admin_emails";
const DEFAULT_SUPER_ADMIN_EMAIL = "admin@nickname.com";

/**
 * Check if user is allowed to access the application when "allowlist" mode is on.
 * Super admin emails (from app_settings or default admin@nickname.com) always have access.
 * Returns Promise<{ allowed: boolean }>. Call after password validation in login.
 */
export async function checkUserAccessAllowed(user) {
  try {
    const email = getUserEmailForAccess(user);
    if (!email) return { allowed: false };

    const rows = await query(
      "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN (?, ?, ?)",
      ["user_access_mode", "user_access_allowed_emails", SUPER_ADMIN_EMAILS_KEY]
    );
    const map = {};
    (rows || []).forEach((r) => { map[r.setting_key] = r.setting_value; });

    const superAdminList = parseAllowedEmails(map[SUPER_ADMIN_EMAILS_KEY]);
    const isSuperAdmin =
      email === DEFAULT_SUPER_ADMIN_EMAIL || superAdminList.includes(email);
    if (isSuperAdmin) return { allowed: true };

    const mode = (map.user_access_mode || "all").toLowerCase();
    if (mode !== "allowlist") return { allowed: true };
    const allowed = parseAllowedEmails(map.user_access_allowed_emails);
    return { allowed: allowed.includes(email) };
  } catch {
    return { allowed: true };
  }
}
const USER_ACCESS_ALLOWED_KEY = USER_ACCESS_ALLOWED_KEY_EXPORT;

function parseAllowedEmails(raw) {
  if (!raw) return [];
  try {
    const list = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(list) ? list.map((e) => String(e).trim().toLowerCase()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

// Get user access settings (mode + allowed emails). Admin only.
export const getSettings = asyncHandler(async (req, res) => {
  const rows = await query(
    "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN (?, ?)",
    [USER_ACCESS_MODE_KEY, USER_ACCESS_ALLOWED_KEY]
  );
  const map = {};
  (rows || []).forEach((r) => { map[r.setting_key] = r.setting_value; });
  const mode = map[USER_ACCESS_MODE_KEY] || "all";
  const allowedEmails = parseAllowedEmails(map[USER_ACCESS_ALLOWED_KEY]);
  return sendSuccess(res, { mode, allowedEmails });
});

// Update user access settings. Admin only.
export const updateSettings = asyncHandler(async (req, res) => {
  const { mode, allowedEmails } = req.body;
  const validMode = mode === "allowlist" ? "allowlist" : "all";
  const list = Array.isArray(allowedEmails) ? allowedEmails.map((e) => String(e).trim().toLowerCase()).filter(Boolean) : [];
  const value = JSON.stringify([...new Set(list)]);

  for (const [key, val] of [
    [USER_ACCESS_MODE_KEY, validMode],
    [USER_ACCESS_ALLOWED_KEY, value],
  ]) {
    const existing = await query("SELECT id FROM app_settings WHERE setting_key = ?", [key]);
    if (existing.length > 0) {
      await query("UPDATE app_settings SET setting_value = ? WHERE setting_key = ?", [val, key]);
    } else {
      await query("INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)", [key, val]);
    }
  }
  return sendSuccess(res, { mode: validMode, allowedEmails: list }, "User access settings updated");
});

// List access requests (pending first). Admin only.
export const listRequests = asyncHandler(async (req, res) => {
  const status = req.query.status || "";
  let sql = "SELECT id, email, status, requested_at, reviewed_by, reviewed_at, notes FROM user_access_requests ORDER BY status = 'pending' DESC, requested_at DESC";
  const params = [];
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    sql = "SELECT id, email, status, requested_at, reviewed_by, reviewed_at, notes FROM user_access_requests WHERE status = ? ORDER BY requested_at DESC";
    params.push(status);
  }
  const rows = await query(sql, params);
  return sendSuccess(res, rows || []);
});

// Create access request (public – no auth). Rate limit should be applied at route level.
export const createRequest = asyncHandler(async (req, res) => {
  const email = (req.body.email || "").toString().trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(res, "Valid email is required", 400);
  }
  const existing = await query("SELECT id, status FROM user_access_requests WHERE email = ? ORDER BY id DESC LIMIT 1", [email]);
  if (existing.length > 0) {
    if (existing[0].status === "pending") {
      return sendSuccess(res, { id: existing[0].id, status: "pending" }, "Request already pending");
    }
    if (existing[0].status === "approved") {
      return sendError(res, "This email already has access", 400);
    }
  }
  await query("INSERT INTO user_access_requests (email, status) VALUES (?, 'pending')", [email]);
  const [inserted] = await query("SELECT LAST_INSERT_ID() as id");
  return sendSuccess(res, { id: inserted.id, status: "pending" }, "Access request submitted. Admin will review.");
});

// Approve request: add email to allowlist and mark request approved. Admin only.
export const approveRequest = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const adminId = req.id || req.employeeId;
  const rows = await query("SELECT id, email FROM user_access_requests WHERE id = ? AND status = 'pending'", [id]);
  if (rows.length === 0) {
    return sendError(res, "Request not found or already processed", 404);
  }
  const email = rows[0].email;

  const existing = await query("SELECT id, setting_value FROM app_settings WHERE setting_key = ?", [USER_ACCESS_ALLOWED_KEY]);
  let list = [];
  if (existing.length > 0 && existing[0].setting_value) {
    list = parseAllowedEmails(existing[0].setting_value);
  }
  if (!list.includes(email)) {
    list.push(email);
    const value = JSON.stringify(list);
    if (existing.length > 0) {
      await query("UPDATE app_settings SET setting_value = ? WHERE setting_key = ?", [value, USER_ACCESS_ALLOWED_KEY]);
    } else {
      await query("INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)", [USER_ACCESS_ALLOWED_KEY, value]);
    }
  }

  await query(
    "UPDATE user_access_requests SET status = 'approved', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
    [adminId, id]
  );
  return sendSuccess(res, { email, allowed: true }, "Access granted");
});

// Reject request. Admin only.
export const rejectRequest = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const adminId = req.id || req.employeeId;
  const notes = (req.body.notes || "").toString().trim().slice(0, 500);
  const result = await query(
    "UPDATE user_access_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), notes = ? WHERE id = ? AND status = 'pending'",
    [adminId, notes || null, id]
  );
  if (result.affectedRows === 0) {
    return sendError(res, "Request not found or already processed", 404);
  }
  return sendSuccess(res, null, "Request rejected");
});
