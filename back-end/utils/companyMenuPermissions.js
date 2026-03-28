/**
 * Company menu toggles (Super Admin → Company Menu Permission).
 *
 * - No rows for this company yet → all platform menus allowed (bootstrap until configured).
 * - At least one row exists → opt-in: only menu_keys with enabled=1 are on; missing keys are off.
 *
 * This keeps company login sidebars aligned with what Super Admin saved in `company_menu_permissions`.
 */
export function resolveCompanyMenuEnabled(menuKey, overridesRows) {
  const list = Array.isArray(overridesRows) ? overridesRows : [];
  if (list.length === 0) return true;

  const key = String(menuKey ?? "").trim();
  const map = new Map(
    list.map((o) => {
      const k = String(o.menu_key ?? "").trim();
      const on = o.enabled === 1 || o.enabled === true || o.enabled === "1";
      return [k, on];
    })
  );

  if (map.has(key)) return map.get(key);
  return false;
}
