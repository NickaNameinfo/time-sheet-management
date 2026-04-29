# SOP — Time Sheet Management System

## 1) Document control
- **System**: Time Sheet Management System (Web + API + Mobile app)
- **Owner**: Admin / System Administrator
- **Applies to**: Admin, HR, Team Lead (TL), Employee, Company (tenant) users
- **Environment examples**:
  - **Frontend (dev)**: `http://localhost:5173`
  - **Backend (dev)**: `http://localhost:10000` (your current config)
- **Response envelope** (most APIs):
  - **Success**: `{ "Status": "Success", "Result": ... }`
  - **Error**: `{ "Status": "Error", "Error": "..." }`

---

## 2) Purpose
This SOP defines the standard operating procedures to:
- Run the application safely (local/dev/prod)
- Onboard users and configure access
- Execute daily workflows (timesheets, leave, approvals, project planning, billing, productivity)
- Handle common incidents and troubleshooting

---

## 3) Roles & responsibilities

### 3.1 Admin (platform)
- **Owns**: Company setup (if applicable), menu permissions, application settings, projects, reports, approvals overview.
- **Can**: Create/manage employees, projects, project planning, billing rates, invoicing, productivity analytics, system settings.

### 3.2 HR
- **Owns**: Employee onboarding data accuracy, leave policy & leave balance, HR approvals.
- **Can**: Create employees (if enabled), manage leave balances, approve/track leave items, view HR dashboards.

### 3.3 Team Lead (TL)
- **Owns**: Team timesheet approvals and utilization accuracy.
- **Can**: Approve timesheets/work details, view team productivity, manage project work details.

### 3.4 Employee
- **Owns**: Correct time logging and timely submission.
- **Can**: Clock in/out, submit work details/timesheets, apply leave/comp-off, view own dashboards.

### 3.5 Company user (tenant portal)
- **Owns**: Company-specific activities (Sales, etc.) depending on menus enabled.
- **Notes**: Company role is distinct from platform roles; menus depend on company permissions configuration.

---

## 4) System modules (what users see)
Menus are role/permission-driven. Typical menu tree includes:
- **Employee Management** (Employees, Roles & Permissions)
- **Project Management** (Projects, Project Planning, Project Work Details)
- **Workforce Management** (Time Tracking, Shift, Overtime, Leave, Comp-Off)
- **Payroll & Finance** (Payroll Export, Billing & Invoicing, Budget Tracking)
- **Approvals** (Approval Center, Leave Approvals, Comp-Off Approvals)
- **Reports & Analytics**
- **Productivity Tracking**
- **System Settings** (Menu Permissions, Overtime Rules, Application Settings, etc.)

Reference: `docs/MENU_STRUCTURE.md`

---

## 5) Environment setup (local development)

### 5.1 Backend setup
1. Go to backend:
   - `cd back-end`
2. Install dependencies:
   - `npm install`
3. Configure `.env` (do not commit):
   - DB: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - Auth: `JWT_SECRET_KEY`
   - Server: `PORT`
   - CORS: `CORS_ORIGIN`
4. Start server:
   - `npm start` (or `npx nodemon server.js`)

Reference: `back-end/README.md`

### 5.2 Frontend setup
1. Go to frontend:
   - `cd front-end`
2. Install dependencies:
   - `npm install`
3. Configure `.env`:
   - `VITE_API_BASE_URL=http://localhost:10000`
4. Start:
   - `npm run dev`

Reference: `front-end/README.md`

### 5.3 Mobile app setup (optional)
Reference: `mobile-app/SETUP.md` and `mobile-app/README.md`

---

## 6) Standard operating procedures (by workflow)

### 6.1 User login (all roles)
1. Open start page `/`
2. Choose login type:
   - Admin: `/login`
   - Employee: `/employee-login`
   - TL: `/teamlead-login`
   - HR: `/hr-login`
3. On successful login:
   - Token is stored in browser storage
   - User is redirected to role dashboard (e.g., `/Dashboard`, `/Employee`, `/TeamLead`, `/Hr`)

Operational checks:
- If login fails repeatedly, verify rate limiting and credentials.
- If page shows “Something went wrong”, check DevTools console and backend logs.

---

### 6.2 Employee onboarding (Admin/HR)
Goal: Create an employee who can log in and submit time/leave.

Procedure:
1. Navigate to **Employee Management → Employees**
2. Click **Add Employee**
3. Fill required fields:
   - EMPID, name, designation, department, contact details
   - Role (Employee/TL/HR/Admin as applicable)
4. Save
5. Verify:
   - Employee appears in list
   - Login works for employee (employee login page)

Controls:
- Use consistent EMPID formats (no duplicates).
- Confirm employee is active.

---

### 6.3 Project creation & assignment (Admin)
Goal: Create a project and ensure employees can log work against it.

Procedure:
1. Navigate to **Project Management → Projects**
2. Click **Add Project**
3. Provide:
   - Project number/reference, name, target dates, allotted hours
   - Assigned employees (roster)
4. Save
5. Verify:
   - Project appears in project list
   - Assigned employees list is correct

Controls:
- Ensure allotted hours and target date are reasonable.
- Confirm roster assignment; project planning and work details depend on this.

---

### 6.4 Project planning (Admin/TL)
Goal: Create a project plan and allocate hours to employees.

Procedure:
1. Navigate to **Project Management → Project Planning**
2. Create or edit a plan:
   - Select project
   - Choose time period, start date
   - Enter total allotted hours
3. Assign employees and allotted hours:
   - Ensure sum of employee hours matches plan total (or your policy)
4. Save
5. Verify:
   - Plan appears with correct status and employee count
   - Assigned Employees section lists all assigned employees

Operational note:
- Plans may include employees not in the project roster; in that case, confirm the employee should be added to project assignment too (recommended for consistency).

---

### 6.5 Time tracking / work details (Employee)
Goal: Record worked hours against projects/tasks and submit for approval.

Procedure:
1. Navigate to **Workforce Management → Time Tracking** (or employee dashboard card)
2. Clock in/out (if enabled)
3. Create work detail/time entry:
   - Select project
   - Enter times / total hours
   - Provide notes/description
4. Submit
5. Ensure status becomes “pending” (or equivalent)

Controls:
- Submit daily to avoid backlogs.
- Keep notes clear for approvals.

---

### 6.6 Timesheet approvals (Team Lead / Admin)
Goal: Approve submitted entries and keep audit trail.

Procedure:
1. Navigate to **Approvals → Approval Center** (or TL approvals menu)
2. Filter by date/project/team member if needed
3. Review entries:
   - Hours, project mapping, description
4. Approve or reject with comments
5. Verify status updated in list

Operational note:
- After approval, productivity metrics may be recalculated for that employee/date (if enabled).

---

### 6.7 Leave management (Employee + HR/Admin)
Goal: Track leave balances and approvals.

Employee:
1. Navigate to **Workforce Management → Leave Management → Apply Leave**
2. Choose leave type and dates/hours
3. Submit

HR/Admin:
1. Navigate to **Approvals → Leave Approvals**
2. Review requests and approve/reject
3. Confirm leave balance updated accordingly

Controls:
- HR should initialize/verify leave balances yearly.
- Ensure correct leave type mapping and year.

---

### 6.8 Overtime (Admin/HR)
Goal: Calculate OT and approve OT records based on rules.

Procedure:
1. Configure OT rules (country-based) in **System Settings → Overtime Rules**
2. Calculate OT using the OT module (UI or API)
3. Review OT records
4. Approve/reject

Reference: `API_DOCUMENTATION.md` (Overtime section)

---

### 6.9 Billing rates & invoicing (Admin/Finance)
Goal: Maintain billing rates and generate invoices from approved work.

Billing rate setup:
1. Navigate to **Payroll & Finance → Billing & Invoicing**
2. Add billing rate:
   - Employee or designation-based
   - Project (optional)
   - Hourly rate, OT multiplier, effective date
3. Save

Invoice generation:
1. Choose client/project and date range
2. Generate invoice
3. Validate:
   - Only approved work included
   - Rates applied as expected

Controls:
- Keep effective dates accurate.
- Track currency policy (system setting vs rate storage).

---

### 6.10 Productivity metrics (Admin/TL)
Goal: Calculate and view productivity metrics.

Procedure:
1. Navigate to **Productivity Tracking**
2. Run calculation (if UI provides) or call API:
   - `POST /productivity/calculate` with `employeeId`, `date`
3. View metrics:
   - Employee metrics list
   - Team metrics (TL)
   - Trend views

Controls:
- Metrics typically rely on approved work details; ensure approvals are processed.

---

### 6.11 Application settings (Admin)
Goal: Standardize UI settings across the app.

Procedure:
1. Navigate to **System Settings → Application Settings**
2. Configure:
   - Theme colors
   - Logo
   - Date/time format and language (if enabled)
3. Save
4. Verify across UI:
   - Sidebar color
   - Logo
   - Date/time rendering

---

## 7) Common incidents & troubleshooting

### 7.1 500 errors from dynamic UPDATE (Unknown column `tokensss`)
Symptom:
- API returns: `Unknown column 'tokensss' in 'SET'`

Cause:
- Client sends auth token fields in JSON body; backend update builder treats them as DB columns.

Fix:
- Backend should ignore auth-only fields when building SQL update sets.

---

### 7.2 “useAuth must be used within an AuthProvider”
Symptom:
- Frontend crashes with React error boundary; console shows the message.

Likely causes:
- Provider ordering or mismatched module import paths causing multiple context instances.

Fix:
- Ensure the app renders `<AuthProvider>` above routes.
- Ensure all imports reference the same `AuthContext` module path.

---

### 7.3 Assigned employee count mismatch (shows 2 assigned but only 1 row)
Symptom:
- UI badge shows correct count; table shows fewer rows until “Add Employee” is opened.

Cause:
- UI list sourced from project roster; plan-only assignees weren’t loaded until fetching all employees.

Fix:
- Merge plan employee snapshot (`GET /project-plan/:id`) into assigned employees UI list.

---

### 7.4 Asset/CSS 404s (Font Awesome / hero images)
Symptom:
- Browser console 404s like `brands.css`, `solid.css`, `hero-bg.jpg`.

Fix:
- Correct import paths or bundle assets properly; remove placeholders like `/your-path-to-fontawesome/...`.

---

## 8) Operational checklists

### 8.1 Daily checklist (Admin)
- [ ] Check pending approvals (Approval Center)
- [ ] Verify time submissions are flowing (no backlog)
- [ ] Validate active projects and plan utilization
- [ ] Verify key dashboards load without 500 errors

### 8.2 Weekly checklist (HR)
- [ ] Review leave requests & balances
- [ ] Confirm new hires are onboarded and can log time
- [ ] Audit inactive/terminated employees access

### 8.3 Monthly checklist (Finance/Admin)
- [ ] Validate billing rates for the month
- [ ] Generate invoices for approved work
- [ ] Export payroll (if used)
- [ ] Review OT records

---

## 9) Change management (recommended)
- Make changes on a feature branch
- Run:
  - Frontend: `npm run build` and `npm run lint`
  - Backend: start server and smoke test critical routes
- Update documentation when:
  - New module/menu is added
  - API payload changes
  - Role/permission behavior changes

---

## 10) References (in-repo)
- Product overview: `PRODUCT_DOCUMENTATION.md`
- API reference: `API_DOCUMENTATION.md`
- Manual testing runbook: `MANUAL_TESTING_WORKFLOW.md`
- Menu structure: `docs/MENU_STRUCTURE.md`
- Frontend setup: `front-end/README.md`
- Backend setup: `back-end/README.md`

