import { query } from "../config/database.js";
import { sendError } from "../utils/response.js";

const DEFAULT_SUPER_ADMIN_EMAIL = "admin@nickname.com";

function parseEmailList(raw) {
  if (!raw) return [];
  try {
    const list = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(list)
      ? list.map((e) => String(e).trim().toLowerCase()).filter(Boolean)
      : [];
  } catch {
    return String(raw)
      .split(/[\n,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }
}

export async function isSuperAdminEmail(email) {
  const e = (email || "").toString().trim().toLowerCase();
  if (!e) return false;
  if (e === DEFAULT_SUPER_ADMIN_EMAIL) return true;
  try {
    const rows = await query(
      "SELECT setting_value FROM app_settings WHERE setting_key = 'super_admin_emails' LIMIT 1"
    );
    const raw = rows?.[0]?.setting_value;
    const list = parseEmailList(raw);
    return list.includes(e);
  } catch {
    return e === DEFAULT_SUPER_ADMIN_EMAIL;
  }
}

export const requireSuperAdmin = async (req, res, next) => {
  // req.userName may differ from employeeEmail; prefer employeeEmail when available.
  let email = (req.userName || "").toString().trim().toLowerCase();
  if (req.id) {
    try {
      const empRows = await query("SELECT employeeEmail FROM employee WHERE id = ? LIMIT 1", [req.id]);
      const e = (empRows?.[0]?.employeeEmail || "").toString().trim().toLowerCase();
      if (e) email = e;
    } catch {
      // ignore
    }
  }
  const ok = await isSuperAdminEmail(email);
  if (!ok) return sendError(res, "Super admin access required", 403);
  return next();
};

