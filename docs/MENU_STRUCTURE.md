# Application Menu Structure

Overview of sidebar menu hierarchy after full restructure.  
Apply with: `npm run restructure-menus` (or run `back-end/database/restructure_menus_full.sql`).

---

## Tree view (sidebar order)

```
Dashboard

Employee Management
├── Employees
└── Roles & Permissions

Project Management
├── Projects
├── Project Planning
└── Project Work Details

Sales & CRM
├── Add CRM Entry
├── CRM Records
├── CRM Summary
└── Leads

Investment Management
├── KYC Management
│   ├── KYC Status
│   ├── Submit / Update KYC
│   └── Update KYC Status
├── Investment Reports
├── User Reports
├── Self Reports
├── Withdrawal Requests
└── Referral Management
    ├── Referral Approvals
    └── Referral Reports

Workforce Management
├── Time Tracking
├── Shift Management
├── Overtime Management
├── Leave Management
│   ├── Leave Balance
│   └── Apply Leave
└── Comp-Off Management

Payroll & Finance
├── Payroll Export
├── Billing & Invoicing
└── Budget Tracking

Approvals
├── Approval Center
├── Leave Approvals
└── Comp-Off Approvals

Reports & Analytics
├── Employee Reports
├── Project Reports
├── Weekly Reports
├── Monthly Reports
├── Yearly Reports
├── Leave Reports
├── Discipline Reports
└── Consolidated Reports

Productivity Tracking
├── Employee Dashboard
├── Team Lead Dashboard
└── Productivity Insights

Automation
└── Automated Reports

System Settings
├── Updates
├── Discipline Rules
├── Designations
├── Roles
├── Area of Work
├── Variations
├── Menu Permissions
├── Overtime Rules
└── Application Settings
```

---

## Root menus (`parent_menu` NULL)

| Order | Menu Key | Title |
|------|----------|--------|
| 1 | `dashboard` | Dashboard |
| 2 | `employee_management` | Employee Management |
| 3 | `project_management` | Project Management |
| 4 | `sales` | Sales & CRM |
| 5 | `investment_management` | Investment Management |
| 6 | `workforce_management` | Workforce Management |
| 7 | `payroll_finance` | Payroll & Finance |
| 8 | `approvals` | Approvals |
| 9 | `reports` | Reports & Analytics |
| 10 | `productivity_tracking` | Productivity Tracking |
| 11 | `automation` | Automation |
| 12 | `settings` | System Settings |

---

## By section

**Employee Management** → `manage_employees`, `roles_permissions`  
_(Team Leads / HR Management admin menus removed; keys `manage_team_leads`, `manage_hr` are inactive.)_  
**Project Management** → `manage_projects`, `project_planning`, `project_work_details`  
**Sales & CRM** → `add_crm_date`, `crm_list`, `crm_summary`, `lead_list`  
**Investment Management** → `investment_kyc_management` (sub-parent), `investment_reports`, `investment_admin_user_reports`, `investment_myself_reports`, `investment_withdrawal_requests`, `investment_referral_management` (sub-parent)  
  - **KYC Management** → `investment_kyc`, `investment_kyc_submit`, `investment_update_kyc_status`  
  - **Referral Management** → `investment_referral_earnings`, `investment_referral_reports`  
**Workforce Management** → `time_tracking`, `shift_management`, `overtime_management`, `leave_management` (sub-parent), `compoff`  
  - **Leave Management** → `leave_balance`, `apply_leave`  
**Payroll & Finance** → `payroll_export`, `billing_invoicing`, `budget_tracking`  
**Approvals** → `approval_center`, `leave_details`, `compoff_details`  
**Reports & Analytics** → `employee_report`, `project_report`, `weekly_report`, `monthly_report`, `yearly_report`, `leave_report`, `discipline_report`, `consolidated_report`  
**Productivity Tracking** → `employee_dashboard`, `teamlead_dashboard`, `productivity`  
_(Menu `time_management` is inactive — Time Management hidden from this group.)_  
**Automation** → `automated_reports`  
**System Settings** → `settings_updates`, `settings_discipline`, `settings_designation`, `settings_roles`, `settings_areaofwork`, `settings_variation`, `menu_permissions`, `settings_overtime_rules`, `settings_app_settings`

---

## Apply the structure

From project root (with DB configured):

```bash
cd back-end && npm run restructure-menus
```

Or run the SQL file in your MySQL client:

```bash
mysql -u user -p your_db < back-end/database/restructure_menus_full.sql
```

---

## Related files

- **Full restructure:** `back-end/database/restructure_menus_full.sql`
- **Script:** `back-end/scripts/restructure-menus-full.js`
- **Sidebar:** `front-end/src/components/CommonSidebar.jsx`

---

## Company login (tenant) menus

Company profile logins (`company_users`) combine:

1. **Platform menu catalog** — `menu_permissions` rows with `is_active = TRUE` (super admin / “Menu Permissions” screen).
2. **Company toggles** — `company_menu_permissions` (`Super Admin → Company Menu Permission`).
   - **No rows** for that company yet → all active platform menus are **enabled** until Super Admin configures.
   - **Any row** exists for that company → **opt-in**: only `menu_key` rows with `enabled = 1` are on; keys not in the table are **off** (new platform menus stay off until added).
3. **Company role** — `company_admin` vs `company_user` (see `getMenuPermissionsByEmployee` in `settingsController.js`).

Helper: `back-end/utils/companyMenuPermissions.js` (`resolveCompanyMenuEnabled`).
