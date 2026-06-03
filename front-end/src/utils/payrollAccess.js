/** Mirrors back-end payslipController.isPayrollAdmin — HR/Admin manage payroll; employees use My Payslips only. */
export function isPayrollAdminUser(roles, user) {
  const roleList = (roles || []).map((r) => String(r ?? "").trim().toLowerCase()).filter(Boolean);
  if (roleList.some((r) => ["admin", "hr", "company_admin"].includes(r))) return true;

  if (user?.isCompanyUser) {
    const cr = String(user.company_role || "").trim().toLowerCase();
    if (cr === "company_admin") return true;
    const menuRole = String(user.company_menu_role || user.employee_table_role || "")
      .trim()
      .toLowerCase();
    if (["admin", "hr"].includes(menuRole)) return true;
  }

  return false;
}

export const PAYROLL_ADMIN_MENU_KEYS = ["salary_payslip", "payroll_export"];
