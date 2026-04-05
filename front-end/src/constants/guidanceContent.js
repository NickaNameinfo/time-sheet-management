/** Shared checklist sections for Guidance page and guided tour. */
export const GUIDANCE_SECTIONS = [
  {
    id: "system-settings",
    title: "Step 1: System Settings (Admin / Super Admin)",
    description:
      "Before employees start using the platform, set up your organization configuration.",
    checklist: [
      { id: "settings-updates", label: "Updates / Announcements" },
      { id: "settings-discipline", label: "Discipline Rules" },
      { id: "settings-designation", label: "Designations" },
      { id: "settings-areaofwork", label: "Area of Work" },
      { id: "settings-variation", label: "Variations" },
      { id: "settings-roles", label: "Roles" },
      { id: "settings-menu-permissions", label: "Menu Permissions (by role/company)" },
      { id: "settings-overtime-rules", label: "Overtime Rules" },
      { id: "settings-app-settings", label: "App Settings" },
      { id: "settings-user-access", label: "User Access (if enabled)" },
    ],
  },
  {
    id: "company-company-admin",
    title: "Step 2: Company Setup (Company Admin Login)",
    description:
      "Connect your company admins and ensure employee records exist in your company database.",
    checklist: [
      { id: "company-link-users", label: "Add / verify company employees (HR/Admin flow)" },
      { id: "company-check-trail", label: "Confirm trial/version status (if enabled)" },
      { id: "company-check-menus", label: "Confirm required sidebar menus are enabled for your company" },
    ],
  },
  {
    id: "employees-roles",
    title: "Step 3: Onboard Employees",
    description: "Create employees and assign roles so they can clock in/out and work on projects.",
    checklist: [
      { id: "onboard-employee", label: "Add Employees" },
      { id: "assign-projects", label: "Assign employees to projects / plans (where applicable)" },
    ],
  },
  {
    id: "projects-planning",
    title: "Step 4: Projects & Planning",
    description:
      "Set up project definitions and planning so employees can enter work details correctly.",
    checklist: [
      { id: "create-project", label: "Create Projects" },
      { id: "create-project-plan", label: "Create / configure Project Plans (if used)" },
      { id: "assign-employees-plan", label: "Assign employees to plan (where applicable)" },
    ],
  },
  {
    id: "daily-workflow",
    title: "Step 5: Daily Workflow (Employee / Team Lead)",
    description: "Use these screens daily to keep time sheets, work details, and statuses correct.",
    checklist: [
      { id: "clock-in-out", label: "Clock in / Clock out (Time Management)" },
      { id: "add-work-details", label: "Add project work details (Work Details)" },
      { id: "review-approvals", label: "Review approvals (Approvals Center)" },
    ],
  },
  {
    id: "leave-compoff",
    title: "Step 6: Leave & Comp-Off",
    description:
      "Apply leave/comp-off and monitor approval/status. HR/Admin updates records when needed.",
    checklist: [
      { id: "apply-leave", label: "Apply leave (leave request screens)" },
      { id: "apply-compoff", label: "Apply comp-off (Comp Off screens)" },
      { id: "approve-status", label: "Track approval status (approved/pending/rejected)" },
    ],
  },
  {
    id: "shifts",
    title: "Step 7: Shifts & Shift Assignments",
    description:
      "Create shifts, assign employees, and manage shift swaps/approvals if required.",
    checklist: [
      { id: "create-shift", label: "Create Shifts (Admin/HR screens)" },
      { id: "assign-shift", label: "Assign shifts to employees" },
      { id: "handle-swaps", label: "Request/approve shift swaps (if used)" },
    ],
  },
  {
    id: "reports",
    title: "Step 8: Reports & Export",
    description:
      "Use reports to audit timesheets and HR/investment operations when needed.",
    checklist: [
      { id: "timesheet-reports", label: "Use Timesheet / Work Reports (Monthly/Weekly/Yearly)" },
      { id: "export-payroll", label: "Export payroll (if enabled)" },
      { id: "download-data", label: "Export / Consolidated reports (when available)" },
    ],
  },
  {
    id: "investment-kyc",
    title: "Step 9: Investment / KYC (If enabled)",
    description:
      "Submit KYC from the user side and verify/update status from admin screens.",
    checklist: [
      { id: "kyc-submit", label: "Submit / Update KYC (My Self side)" },
      { id: "kyc-admin-verify", label: "Verify KYC status (Update KYC Status)" },
      { id: "kyc-documents", label: "Review Aadhaar / PAN documents (View document actions)" },
    ],
  },
];
