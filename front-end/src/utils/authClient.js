/**
 * Decode JWT payload from localStorage (client-side, not verified).
 * Used for UI flags like company vs platform admin.
 */
export function getTokenPayload() {
  try {
    const t = localStorage.getItem("token");
    if (!t || typeof t !== "string") return null;
    const parts = t.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** True when logged in as a company (tenant) admin/user — email login from company_users. */
export function isCompanyAccount() {
  const p = getTokenPayload();
  if (!p || typeof p !== "object") return false;
  return !!(
    p.isCompanyUser === true ||
    (p.company_id != null && p.company_id !== "") ||
    (p.company_user_id != null && p.company_user_id !== "")
  );
}
