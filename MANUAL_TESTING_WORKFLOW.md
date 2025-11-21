# Manual Unit Testing Workflow

## Overview
This document provides a comprehensive manual testing workflow for all Phase 1 & 2 features of the Time Sheet Management System. Follow this guide to systematically test all backend APIs and frontend components.

---

## Prerequisites

### 1. Environment Setup
- [ ] Backend server running on `http://localhost:8000`
- [ ] Frontend server running (typically `http://localhost:5173` or similar)
- [ ] Database connection established
- [ ] All migrations executed
- [ ] Test user accounts created (Admin, HR, Team Lead, Employee)

### 2. Test Data Preparation
Create test data for:
- [ ] At least 3 employees with different roles
- [ ] At least 2 projects
- [ ] At least 1 client
- [ ] Sample work hours/timesheets
- [ ] Sample leave requests

### 3. Testing Tools
- [ ] Postman/Insomnia for API testing
- [ ] Browser DevTools (Network tab)
- [ ] Database client (MySQL Workbench/phpMyAdmin)
- [ ] Excel viewer for export testing

---

## Testing Workflow Structure

### Phase 1: Backend API Testing
### Phase 2: Frontend Component Testing
### Phase 3: Integration Testing
### Phase 4: End-to-End Workflow Testing

---

## Phase 1: Backend API Testing

### 1.1 Authentication & Authorization Testing

#### Test 1.1.1: Login and Token Generation
**Endpoint:** `POST /login`
**Test Data:**
```json
{
  "email": "admin@test.com",
  "password": "password123",
  "role": "admin"
}
```
**Expected Result:**
- Status: 200
- Response contains JWT token
- Token is valid for subsequent requests

**Test Steps:**
1. Send POST request to `/login`
2. Verify response status is 200
3. Extract token from response
4. Verify token format (JWT)
5. Use token in Authorization header for next request

---

### 1.2 Overtime Management API Testing

#### Test 1.2.1: Get OT Rules
**Endpoint:** `GET /overtime/rules?country=UAE`
**Headers:** `Authorization: Bearer <token>`

**Expected Result:**
- Status: 200
- Response contains OT rules with:
  - daily_hours_limit
  - weekly_hours_limit
  - friday_multiplier
  - holiday_multiplier
  - night_shift_multiplier

**Test Steps:**
1. Send GET request with valid token
2. Verify response structure
3. Verify all required fields are present
4. Verify numeric values are correct

---

#### Test 1.2.2: Calculate Overtime
**Endpoint:** `POST /overtime/calculate`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "employeeId": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- Response contains:
  - totalOTHours
  - dailyOT
  - weeklyOT
  - hourlyRate
  - estimatedOTAmount

**Test Steps:**
1. Ensure employee has work hours in the date range
2. Send POST request
3. Verify calculation logic:
   - Daily OT = hours > 8 per day
   - Weekly OT = hours > 48 per week
   - Amount = OT hours × hourly rate × multiplier
4. Verify response structure

**Edge Cases:**
- Test with employee having no work hours
- Test with invalid date range
- Test with non-existent employeeId

---

#### Test 1.2.3: Get OT Records
**Endpoint:** `GET /overtime/records?employeeId=1&startDate=2024-01-01&endDate=2024-01-31&status=approved`

**Expected Result:**
- Status: 200
- Array of OT records
- Each record contains: id, employeeId, date, otHours, status

**Test Steps:**
1. Send GET request with filters
2. Verify filtered results match criteria
3. Test with different status values (pending, approved, rejected)
4. Test with date range filters

---

#### Test 1.2.4: Approve OT Request
**Endpoint:** `POST /overtime/approve/:id`
**Body:**
```json
{
  "status": "approved",
  "approverId": 1,
  "comments": "Approved for payment",
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- OT record status updated to "approved"
- Approval history created

**Test Steps:**
1. Create an OT record first (via calculate endpoint)
2. Get the OT record ID
3. Send approval request
4. Verify status change in database
5. Verify approval history entry

---

### 1.3 Leave Balance Management API Testing

#### Test 1.3.1: Get Leave Balance
**Endpoint:** `GET /leave/balance?employeeId=1&year=2024`

**Expected Result:**
- Status: 200
- Array of leave balances by type:
  - annual
  - sick
  - casual
  - emergency
- Each balance shows: balance, accrued, used, year

**Test Steps:**
1. Send GET request
2. Verify all leave types are returned
3. Verify balance calculations: balance = accrued - used
4. Test with different years

---

#### Test 1.3.2: Initialize Leave Balance
**Endpoint:** `POST /leave/balance/initialize`
**Body:**
```json
{
  "employeeId": 1,
  "leaveType": "annual",
  "initialBalance": 21,
  "year": 2024,
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- Leave balance record created
- Initial balance set correctly

**Test Steps:**
1. Send POST request
2. Verify record created in database
3. Verify balance = initialBalance
4. Verify accrued = initialBalance
5. Verify used = 0
6. Test with different leave types

---

#### Test 1.3.3: Accrue Leave
**Endpoint:** `POST /leave/accrue`
**Body:**
```json
{
  "employeeId": 1,
  "leaveType": "annual",
  "accrualAmount": 1.75,
  "accrualType": "monthly",
  "comments": "Monthly accrual for January",
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- Leave balance updated
- Accrual history record created
- Balance increased by accrualAmount

**Test Steps:**
1. Get current balance
2. Send POST request
3. Verify balance increased correctly
4. Verify accrual history entry
5. Verify accrued field updated

---

#### Test 1.3.4: Use Leave (Deduct Balance)
**Endpoint:** `POST /leave/use`
**Body:**
```json
{
  "employeeId": 1,
  "leaveType": "annual",
  "leaveHours": 8,
  "year": 2024,
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- Balance decreased by leaveHours
- Used field increased

**Test Steps:**
1. Get current balance
2. Send POST request
3. Verify balance decreased correctly
4. Verify used field increased
5. Test with insufficient balance (should fail)

---

### 1.4 Shift Management API Testing

#### Test 1.4.1: Create Shift
**Endpoint:** `POST /shifts`
**Body:**
```json
{
  "name": "Morning Shift",
  "startTime": "08:00:00",
  "endTime": "17:00:00",
  "breakDuration": 60,
  "breakStart": "13:00:00",
  "isNightShift": false,
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- Shift created with ID
- All fields saved correctly

**Test Steps:**
1. Send POST request
2. Verify response contains shift ID
3. Verify shift in database
4. Test with night shift (isNightShift: true)
5. Test with invalid time format (should fail)

---

#### Test 1.4.2: Get All Shifts
**Endpoint:** `GET /shifts?isActive=true`

**Expected Result:**
- Status: 200
- Array of shifts
- Filtered by isActive if provided

**Test Steps:**
1. Send GET request
2. Verify all shifts returned
3. Test with isActive filter
4. Verify shift details are complete

---

#### Test 1.4.3: Assign Shift to Employee
**Endpoint:** `POST /shifts/assign`
**Body:**
```json
{
  "employeeId": 1,
  "shiftId": 1,
  "assignmentDate": "2024-01-01",
  "endDate": "2024-12-31",
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- Shift assignment created
- Employee assigned to shift

**Test Steps:**
1. Create shift first
2. Send POST request
3. Verify assignment in database
4. Test with overlapping assignments (should handle or reject)
5. Test with invalid dates (should fail)

---

#### Test 1.4.4: Get Shift Assignments
**Endpoint:** `GET /shifts/assignments?employeeId=1&startDate=2024-01-01&endDate=2024-12-31`

**Expected Result:**
- Status: 200
- Array of shift assignments
- Filtered by employee and date range

**Test Steps:**
1. Create assignments first
2. Send GET request
3. Verify filtered results
4. Test with different date ranges

---

#### Test 1.4.5: Request Shift Swap
**Endpoint:** `POST /shifts/swap`
**Body:**
```json
{
  "requesterId": 1,
  "swapWithId": 2,
  "originalShiftDate": "2024-01-15",
  "swapShiftDate": "2024-01-16",
  "comments": "Need to swap shifts",
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- Shift swap request created
- Status: pending

**Test Steps:**
1. Ensure both employees have shifts on those dates
2. Send POST request
3. Verify swap request created
4. Test approval/rejection flow

---

### 1.5 Payroll Export API Testing

#### Test 1.5.1: Generate Payroll Summary (JSON)
**Endpoint:** `GET /payroll/summary?employeeId=1&startDate=2024-01-01&endDate=2024-01-31&format=json`

**Expected Result:**
- Status: 200
- JSON response with:
  - Employee details
  - Regular hours
  - OT hours
  - Salary breakdown
  - Deductions
  - Net pay

**Test Steps:**
1. Ensure employee has work hours
2. Send GET request
3. Verify all fields present
4. Verify calculations are correct
5. Test with different date ranges

---

#### Test 1.5.2: Export to Excel
**Endpoint:** `GET /payroll/summary?employeeId=1&startDate=2024-01-01&endDate=2024-01-31&format=excel`

**Expected Result:**
- Status: 200
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- Excel file downloaded

**Test Steps:**
1. Send GET request
2. Verify file download
3. Open file in Excel
4. Verify data is correct
5. Verify formatting

---

#### Test 1.5.3: Export to PDF
**Endpoint:** `GET /payroll/summary?employeeId=1&startDate=2024-01-01&endDate=2024-01-31&format=pdf`

**Expected Result:**
- Status: 200
- Content-Type: application/pdf
- PDF file downloaded

**Test Steps:**
1. Send GET request
2. Verify file download
3. Open PDF
4. Verify content and formatting

---

#### Test 1.5.4: Export to Tally Format
**Endpoint:** `GET /payroll/export/tally?startDate=2024-01-01&endDate=2024-01-31`

**Expected Result:**
- Status: 200
- CSV file with Tally format
- Proper headers and data format

**Test Steps:**
1. Send GET request
2. Verify CSV download
3. Verify Tally-specific format
4. Test import in Tally (if available)

---

#### Test 1.5.5: Export to QuickBooks Format
**Endpoint:** `GET /payroll/export/quickbooks?startDate=2024-01-01&endDate=2024-01-31`

**Expected Result:**
- Status: 200
- IIF file download
- QuickBooks-compatible format

**Test Steps:**
1. Send GET request
2. Verify IIF file download
3. Verify QuickBooks format
4. Test import in QuickBooks (if available)

---

### 1.6 Project Budget Tracking API Testing

#### Test 1.6.1: Set Project Budget
**Endpoint:** `POST /projects/:projectId/budget`
**Body:**
```json
{
  "budgetAmount": 100000,
  "budgetHours": 1000,
  "currency": "AED",
  "budgetType": "total",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- Budget record created
- All fields saved correctly

**Test Steps:**
1. Ensure project exists
2. Send POST request
3. Verify budget in database
4. Test with different currencies
5. Test with invalid projectId (should fail)

---

#### Test 1.6.2: Track Project Cost
**Endpoint:** `POST /projects/:projectId/costs`
**Body:**
```json
{
  "costDate": "2024-01-15",
  "employeeCost": 5000,
  "overheadCost": 1000,
  "materialCost": 2000,
  "hoursSpent": 50,
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- Cost record created
- Total cost calculated correctly

**Test Steps:**
1. Set budget first
2. Send POST request
3. Verify cost record
4. Verify total cost = employeeCost + overheadCost + materialCost
5. Test with multiple cost entries

---

#### Test 1.6.3: Get Budget vs Actual
**Endpoint:** `GET /projects/:projectId/budget-vs-actual`

**Expected Result:**
- Status: 200
- Response contains:
  - budget (amount, hours)
  - actual (cost, hours)
  - variance (amount, percent, hours, hoursPercent)
  - status (under_budget, over_budget, on_budget)

**Test Steps:**
1. Set budget and add costs
2. Send GET request
3. Verify calculations:
   - variance.amount = budget.amount - actual.cost
   - variance.percent = (variance.amount / budget.amount) × 100
4. Verify status is correct based on variance

---

#### Test 1.6.4: Get Profitability Report
**Endpoint:** `GET /projects/:projectId/profitability`

**Expected Result:**
- Status: 200
- Response contains:
  - revenue
  - cost
  - profit
  - margin (percent)
  - roi (percent)
  - status (profitable, loss, break_even)

**Test Steps:**
1. Set budget, add costs, and set revenue (if applicable)
2. Send GET request
3. Verify calculations:
   - profit = revenue - cost
   - margin = (profit / revenue) × 100
   - roi = (profit / cost) × 100
4. Verify status based on profit

---

### 1.7 Client Billing & Invoicing API Testing

#### Test 1.7.1: Create Client
**Endpoint:** `POST /clients`
**Body:**
```json
{
  "clientName": "ABC Company",
  "contactPerson": "John Doe",
  "email": "john@abc.com",
  "phone": "+971501234567",
  "address": "Dubai, UAE",
  "city": "Dubai",
  "country": "UAE",
  "paymentTerms": "net_30",
  "currency": "AED",
  "taxId": "TAX123456",
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- Client created with ID
- All fields saved correctly

**Test Steps:**
1. Send POST request
2. Verify client ID in response
3. Verify client in database
4. Test with duplicate email (should fail or handle)
5. Test with invalid email format (should fail)

---

#### Test 1.7.2: Create Billing Rate
**Endpoint:** `POST /billing/rates`
**Body:**
```json
{
  "employeeId": 1,
  "designation": "Engineer",
  "disciplineCode": "CIV",
  "projectId": 1,
  "hourlyRate": 150,
  "otRateMultiplier": 1.5,
  "effectiveDate": "2024-01-01",
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- Billing rate created
- OT rate calculated: hourlyRate × otRateMultiplier

**Test Steps:**
1. Ensure employee and project exist
2. Send POST request
3. Verify rate in database
4. Test with different designations
5. Test with multiple rates for same employee

---

#### Test 1.7.3: Generate Invoice
**Endpoint:** `POST /invoices/generate`
**Body:**
```json
{
  "clientId": 1,
  "projectId": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "taxRate": 5,
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- Invoice created with invoice number
- Invoice items generated from work hours
- Calculations:
  - subtotal = sum of (hours × rate)
  - taxAmount = subtotal × (taxRate / 100)
  - totalAmount = subtotal + taxAmount

**Test Steps:**
1. Ensure client, project, billing rates, and work hours exist
2. Send POST request
3. Verify invoice created
4. Verify invoice number format
5. Verify invoice items match work hours
6. Verify calculations are correct
7. Verify due date = invoiceDate + paymentTerms

---

#### Test 1.7.4: Get Invoices
**Endpoint:** `GET /invoices?clientId=1&status=paid&startDate=2024-01-01&endDate=2024-12-31`

**Expected Result:**
- Status: 200
- Array of invoices
- Filtered by criteria

**Test Steps:**
1. Create invoices first
2. Send GET request with filters
3. Verify filtered results
4. Test with different status values
5. Test with date range filters

---

#### Test 1.7.5: Record Payment
**Endpoint:** `POST /invoices/:invoiceId/payments`
**Body:**
```json
{
  "paymentDate": "2024-02-15",
  "amount": 15750,
  "paymentMethod": "bank_transfer",
  "referenceNumber": "TXN123456",
  "notes": "Payment received",
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- Payment recorded
- Invoice status updated to "paid" if full amount paid
- Payment history created

**Test Steps:**
1. Create invoice first
2. Send POST request
3. Verify payment record
4. Verify invoice status updated
5. Test partial payment (status should remain "pending")
6. Test overpayment (should handle or reject)

---

### 1.8 Productivity Metrics API Testing

#### Test 1.8.1: Calculate Productivity
**Endpoint:** `POST /productivity/calculate`
**Body:**
```json
{
  "employeeId": 1,
  "date": "2024-01-15",
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- Response contains:
  - totalHours
  - productiveHours
  - idleTimeMinutes
  - tasksCompleted
  - tasksAssigned
  - productivityScore (percent)
  - taskCompletionRate (percent)

**Test Steps:**
1. Ensure employee has work hours and tasks for the date
2. Send POST request
3. Verify calculations:
   - productivityScore = (productiveHours / totalHours) × 100
   - taskCompletionRate = (tasksCompleted / tasksAssigned) × 100
4. Verify idleTimeMinutes = (totalHours - productiveHours) × 60

---

#### Test 1.8.2: Get Productivity Metrics
**Endpoint:** `GET /productivity/metrics?employeeId=1&startDate=2024-01-01&endDate=2024-01-31`

**Expected Result:**
- Status: 200
- Array of productivity metrics
- Aggregated data for date range

**Test Steps:**
1. Calculate productivity for multiple dates
2. Send GET request
3. Verify aggregated metrics
4. Verify date range filtering

---

#### Test 1.8.3: Get Team Productivity
**Endpoint:** `GET /productivity/team?teamLeadId=1&startDate=2024-01-01&endDate=2024-01-31`

**Expected Result:**
- Status: 200
- Response contains:
  - teamMetrics (array of employee metrics)
  - teamAverage (aggregated team metrics)

**Test Steps:**
1. Ensure team lead has team members
2. Calculate productivity for team members
3. Send GET request
4. Verify team metrics
5. Verify team average calculations

---

#### Test 1.8.4: Get Productivity Trends
**Endpoint:** `GET /productivity/trends?employeeId=1&period=monthly&startDate=2024-01-01&endDate=2024-12-31`

**Expected Result:**
- Status: 200
- Array of trend data points
- Grouped by period (daily, weekly, monthly)

**Test Steps:**
1. Calculate productivity for multiple dates
2. Send GET request with period filter
3. Verify trend data grouped correctly
4. Test with different periods

---

### 1.9 Approval Workflows API Testing

#### Test 1.9.1: Get Pending Approvals
**Endpoint:** `GET /approvals/pending?approverId=1&entityType=leave`

**Expected Result:**
- Status: 200
- Array of pending approvals
- Filtered by approver and entity type

**Test Steps:**
1. Create leave requests, OT requests, timesheets
2. Send GET request
3. Verify filtered results
4. Test with different entityType values (leave, overtime, timesheet)
5. Test with different approverIds

---

#### Test 1.9.2: Approve Entity (Leave)
**Endpoint:** `POST /approvals/leave/:entityId`
**Body:**
```json
{
  "approverId": 1,
  "status": "approved",
  "comments": "Approved",
  "approvalLevel": 1,
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- Leave request approved
- Approval history created
- Leave balance deducted (if applicable)

**Test Steps:**
1. Create leave request first
2. Send POST request
3. Verify leave status updated
4. Verify approval history entry
5. Verify leave balance deducted
6. Test rejection flow (status: "rejected")

---

#### Test 1.9.3: Approve Entity (Overtime)
**Endpoint:** `POST /approvals/overtime/:entityId`
**Body:**
```json
{
  "approverId": 1,
  "status": "approved",
  "comments": "Approved",
  "approvalLevel": 1,
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- OT request approved
- Approval history created

**Test Steps:**
1. Create OT record first
2. Send POST request
3. Verify OT status updated
4. Verify approval history

---

#### Test 1.9.4: Bulk Approve
**Endpoint:** `POST /approvals/bulk`
**Body:**
```json
{
  "entityType": "overtime",
  "entityIds": [1, 2, 3],
  "approverId": 1,
  "comments": "Bulk approved",
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- All entities approved
- Approval history for each entity

**Test Steps:**
1. Create multiple OT records
2. Send POST request with array of IDs
3. Verify all records approved
4. Verify approval history for each
5. Test with mixed valid/invalid IDs

---

#### Test 1.9.5: Get Approval History
**Endpoint:** `GET /approvals/history?entityType=leave&entityId=1`

**Expected Result:**
- Status: 200
- Array of approval history records
- Chronological order

**Test Steps:**
1. Create and approve/reject multiple times
2. Send GET request
3. Verify history entries
4. Verify chronological order
5. Test with different entity types

---

### 1.10 Automated Reports API Testing

#### Test 1.10.1: Create Report Schedule
**Endpoint:** `POST /reports/schedules`
**Body:**
```json
{
  "reportType": "weekly",
  "reportName": "Weekly Summary Report",
  "recipients": [
    {"email": "admin@company.com", "role": "admin"},
    {"email": "hr@company.com", "role": "hr"}
  ],
  "scheduleConfig": {
    "frequency": "weekly",
    "time": "09:00",
    "day": "monday"
  },
  "tokensss": "<token>"
}
```

**Expected Result:**
- Status: 200
- Report schedule created
- Schedule ID returned

**Test Steps:**
1. Send POST request
2. Verify schedule created
3. Verify schedule config saved
4. Test with different frequencies (daily, weekly, monthly)
5. Test with invalid schedule config (should fail)

---

#### Test 1.10.2: Get Report Schedules
**Endpoint:** `GET /reports/schedules`

**Expected Result:**
- Status: 200
- Array of report schedules
- Active and inactive schedules

**Test Steps:**
1. Create multiple schedules
2. Send GET request
3. Verify all schedules returned
4. Test with active/inactive filters

---

#### Test 1.10.3: Generate Report Manually
**Endpoint:** `POST /reports/generate`
**Body:**
```json
{
  "reportType": "monthly",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "format": "email",
  "recipients": ["admin@company.com"]
}
```

**Expected Result:**
- Status: 200
- Report generated
- Email sent (if format is email)
- Report data returned (if format is json)

**Test Steps:**
1. Ensure SMTP configured
2. Send POST request
3. Verify report generated
4. Verify email sent (check inbox)
5. Test with different report types
6. Test with json format (should return data)

---

#### Test 1.10.4: Send Scheduled Report
**Endpoint:** `POST /reports/send/:scheduleId`

**Expected Result:**
- Status: 200
- Report generated and sent
- Email delivered to recipients

**Test Steps:**
1. Create report schedule
2. Send POST request
3. Verify report generated
4. Verify email sent
5. Test with invalid scheduleId (should fail)

---

## Phase 2: Frontend Component Testing

### 2.1 Overtime Management Component

#### Test 2.1.1: Component Rendering
**Route:** `/Dashboard/Overtime`

**Test Steps:**
1. Navigate to Overtime Management page
2. Verify page loads without errors
3. Verify all UI elements render:
   - Employee selector
   - Date range picker
   - Calculate OT button
   - OT records table
   - Approval buttons

**Expected Result:**
- Page loads successfully
- All UI elements visible
- No console errors

---

#### Test 2.1.2: Calculate Overtime
**Test Steps:**
1. Select employee from dropdown
2. Select date range (start and end dates)
3. Click "Calculate OT" button
4. Verify loading state appears
5. Verify OT calculation results displayed
6. Verify OT records appear in table

**Expected Result:**
- Calculation triggered
- Results displayed correctly
- OT records shown in table
- Error handling if calculation fails

---

#### Test 2.1.3: Approve/Reject OT
**Test Steps:**
1. View pending OT records
2. Click "Approve" button on a record
3. Verify confirmation dialog (if any)
4. Verify approval success message
5. Verify record status updated in table
6. Repeat for "Reject" button

**Expected Result:**
- Approval/rejection works
- Status updates immediately
- Success/error messages displayed
- Table refreshes

---

#### Test 2.1.4: Date Range Filtering
**Test Steps:**
1. Select different date ranges
2. Verify OT records filtered correctly
3. Test with invalid date ranges
4. Test with no records in range

**Expected Result:**
- Filtering works correctly
- Empty state shown when no records
- Error handling for invalid dates

---

### 2.2 Leave Balance Component

#### Test 2.2.1: View Leave Balance
**Route:** `/Dashboard/LeaveBalance`

**Test Steps:**
1. Navigate to Leave Balance page
2. Select employee and year
3. Verify leave balance cards displayed:
   - Annual leave
   - Sick leave
   - Casual leave
   - Emergency leave
4. Verify balance, accrued, and used shown

**Expected Result:**
- All leave types displayed
- Correct balances shown
- Year filter works

---

#### Test 2.2.2: Initialize Leave Balance
**Test Steps:**
1. Click "Initialize Balance" button
2. Fill form:
   - Employee
   - Leave type
   - Initial balance
   - Year
3. Submit form
4. Verify success message
5. Verify balance updated

**Expected Result:**
- Form validation works
- Balance initialized correctly
- Success message displayed

---

#### Test 2.2.3: Accrue Leave
**Test Steps:**
1. Click "Accrue Leave" button
2. Fill form:
   - Employee
   - Leave type
   - Accrual amount
   - Accrual type
   - Comments
3. Submit form
4. Verify balance increased
5. Verify accrual history updated

**Expected Result:**
- Accrual processed correctly
- Balance updated
- History entry created

---

#### Test 2.2.4: View Accrual History
**Test Steps:**
1. View accrual history table
2. Verify all accruals listed
3. Verify date, amount, type shown
4. Test sorting/filtering if available

**Expected Result:**
- History displayed correctly
- All fields visible
- Chronological order

---

### 2.3 Shift Management Component

#### Test 2.3.1: View Shifts
**Route:** `/Dashboard/Shifts`

**Test Steps:**
1. Navigate to Shift Management page
2. Verify shifts table displayed
3. Verify all shift details shown:
   - Name
   - Start time
   - End time
   - Break duration
   - Status

**Expected Result:**
- Shifts table loads
- All shifts displayed
- Status indicators visible

---

#### Test 2.3.2: Create Shift
**Test Steps:**
1. Click "Create Shift" button
2. Fill form:
   - Name
   - Start time
   - End time
   - Break duration
   - Break start time
   - Night shift checkbox
3. Submit form
4. Verify shift created
5. Verify shift appears in table

**Expected Result:**
- Form validation works
- Shift created successfully
- Table updated

---

#### Test 2.3.3: Assign Shift to Employee
**Test Steps:**
1. Click "Assign Shift" button
2. Select employee
3. Select shift
4. Select assignment dates
5. Submit form
6. Verify assignment created
7. Verify assignment in assignments table

**Expected Result:**
- Assignment created
- Table updated
- Date validation works

---

#### Test 2.3.4: View Shift Assignments
**Test Steps:**
1. View shift assignments table
2. Verify assignments displayed
3. Filter by employee or date range
4. Verify filtered results

**Expected Result:**
- Assignments displayed
- Filtering works
- All details visible

---

### 2.4 Payroll Export Component

#### Test 2.4.1: Generate Payroll Summary
**Route:** `/Dashboard/Payroll`

**Test Steps:**
1. Navigate to Payroll Export page
2. Select employee (or all employees)
3. Select date range
4. Select format (JSON, Excel, PDF)
5. Click export button
6. Verify file download

**Expected Result:**
- Export triggered
- File downloads
- File format correct
- Data accurate

---

#### Test 2.4.2: Export to Excel
**Test Steps:**
1. Select Excel format
2. Click export
3. Verify Excel file downloads
4. Open file in Excel
5. Verify data and formatting

**Expected Result:**
- Excel file downloads
- Data correct
- Formatting proper

---

#### Test 2.4.3: Export to PDF
**Test Steps:**
1. Select PDF format
2. Click export
3. Verify PDF downloads
4. Open PDF
5. Verify content and layout

**Expected Result:**
- PDF downloads
- Content correct
- Layout proper

---

#### Test 2.4.4: Export to Tally/QuickBooks
**Test Steps:**
1. Select Tally or QuickBooks format
2. Click export
3. Verify file downloads
4. Verify format is correct

**Expected Result:**
- File downloads
- Format correct
- Importable to accounting software

---

### 2.5 Budget Tracking Component

#### Test 2.5.1: View Budget
**Route:** `/Dashboard/Projects/:projectId/Budget`

**Test Steps:**
1. Navigate to project budget page
2. Verify budget information displayed
3. Verify budget vs actual comparison
4. Verify progress indicators

**Expected Result:**
- Budget data displayed
- Visual indicators work
- Calculations correct

---

#### Test 2.5.2: Set Project Budget
**Test Steps:**
1. Click "Set Budget" button
2. Fill form:
   - Budget amount
   - Budget hours
   - Currency
   - Date range
3. Submit form
4. Verify budget set
5. Verify budget displayed

**Expected Result:**
- Budget set successfully
- Display updated
- Validation works

---

#### Test 2.5.3: Track Project Cost
**Test Steps:**
1. Click "Add Cost" button
2. Fill form:
   - Cost date
   - Employee cost
   - Overhead cost
   - Material cost
   - Hours spent
3. Submit form
4. Verify cost added
5. Verify budget vs actual updated

**Expected Result:**
- Cost tracked
- Budget comparison updated
- Variance calculated

---

#### Test 2.5.4: View Profitability Report
**Test Steps:**
1. Click "View Profitability" button
2. Verify profitability metrics displayed:
   - Revenue
   - Cost
   - Profit
   - Margin
   - ROI
3. Verify status indicator

**Expected Result:**
- Metrics displayed correctly
- Calculations accurate
- Status indicator correct

---

### 2.6 Billing Management Component

#### Test 2.6.1: View Clients
**Route:** `/Dashboard/Billing`

**Test Steps:**
1. Navigate to Billing Management page
2. Switch to "Clients" tab
3. Verify clients table displayed
4. Verify all client details shown

**Expected Result:**
- Clients table loads
- All clients displayed
- Details complete

---

#### Test 2.6.2: Create Client
**Test Steps:**
1. Click "Create Client" button
2. Fill form with all client details
3. Submit form
4. Verify client created
5. Verify client appears in table

**Expected Result:**
- Client created
- Form validation works
- Table updated

---

#### Test 2.6.3: Create Billing Rate
**Test Steps:**
1. Switch to "Rates" tab
2. Click "Create Rate" button
3. Fill form:
   - Employee
   - Designation
   - Project
   - Hourly rate
   - OT multiplier
4. Submit form
5. Verify rate created

**Expected Result:**
- Rate created
- Validation works
- Table updated

---

#### Test 2.6.4: Generate Invoice
**Test Steps:**
1. Switch to "Invoices" tab
2. Click "Generate Invoice" button
3. Fill form:
   - Client
   - Project
   - Date range
   - Tax rate
4. Submit form
5. Verify invoice generated
6. Verify invoice in table

**Expected Result:**
- Invoice generated
- Invoice number created
- Items populated from work hours
- Calculations correct

---

#### Test 2.6.5: Record Payment
**Test Steps:**
1. Select invoice from table
2. Click "Record Payment" button
3. Fill payment form
4. Submit form
5. Verify payment recorded
6. Verify invoice status updated

**Expected Result:**
- Payment recorded
- Invoice status updated
- Payment history updated

---

### 2.7 Productivity Dashboard Component

#### Test 2.7.1: View Productivity Metrics
**Route:** `/Dashboard/Productivity`

**Test Steps:**
1. Navigate to Productivity Dashboard
2. Select employee and date range
3. Verify productivity metrics displayed:
   - Productivity score
   - Task completion rate
   - Total hours
   - Productive hours
   - Idle time

**Expected Result:**
- Metrics displayed
- Calculations correct
- Visual indicators work

---

#### Test 2.7.2: Calculate Productivity
**Test Steps:**
1. Select employee
2. Select date
3. Click "Calculate Today" button
4. Verify calculation triggered
5. Verify results displayed

**Expected Result:**
- Calculation works
- Results accurate
- Loading state shown

---

#### Test 2.7.3: View Team Productivity
**Test Steps:**
1. Select team lead
2. Select date range
3. View team comparison table
4. Verify team metrics displayed
5. Verify team average shown

**Expected Result:**
- Team metrics displayed
- Comparison works
- Average calculated correctly

---

#### Test 2.7.4: View Productivity Trends
**Test Steps:**
1. Select employee
2. Select date range
3. View trends chart/graph
4. Verify trend data displayed

**Expected Result:**
- Trends displayed
- Chart/graph renders
- Data accurate

---

### 2.8 Approval Center Component

#### Test 2.8.1: View Pending Approvals
**Route:** `/Dashboard/Approvals`

**Test Steps:**
1. Navigate to Approval Center
2. Switch between tabs (Leaves, Overtime, Timesheets)
3. Verify pending approvals listed
4. Verify approval details shown

**Expected Result:**
- Pending approvals displayed
- Tabs work correctly
- Details complete

---

#### Test 2.8.2: Approve Individual Item
**Test Steps:**
1. Select an approval item
2. Click "Approve" button
3. Add comments (if required)
4. Submit approval
5. Verify item removed from pending list
6. Verify success message

**Expected Result:**
- Approval works
- Item removed from list
- Success message shown

---

#### Test 2.8.3: Reject Individual Item
**Test Steps:**
1. Select an approval item
2. Click "Reject" button
3. Add rejection comments
4. Submit rejection
5. Verify item removed from pending list

**Expected Result:**
- Rejection works
- Comments saved
- Item removed

---

#### Test 2.8.4: Bulk Approve
**Test Steps:**
1. Select multiple approval items (checkboxes)
2. Click "Bulk Approve" button
3. Add comments
4. Submit bulk approval
5. Verify all items approved
6. Verify items removed from list

**Expected Result:**
- Bulk approval works
- All items processed
- List updated

---

#### Test 2.8.5: View Approval History
**Test Steps:**
1. Click "View History" button
2. Verify approval history displayed
3. Verify all history entries shown
4. Verify chronological order

**Expected Result:**
- History displayed
- All entries shown
- Order correct

---

## Phase 3: Integration Testing

### 3.1 End-to-End Workflows

#### Test 3.1.1: Complete Overtime Workflow
**Test Steps:**
1. Employee logs work hours
2. Admin calculates OT for period
3. OT records generated
4. Admin views pending OT approvals
5. Admin approves OT
6. OT included in payroll export
7. Verify complete flow works

**Expected Result:**
- All steps work together
- Data flows correctly
- No data loss

---

#### Test 3.1.2: Complete Leave Workflow
**Test Steps:**
1. Admin initializes leave balance
2. System accrues leave monthly
3. Employee requests leave
4. Admin approves leave
5. Leave balance deducted automatically
6. Verify balance updated correctly

**Expected Result:**
- Complete workflow works
- Balance calculations correct
- Automatic deduction works

---

#### Test 3.1.3: Complete Billing Workflow
**Test Steps:**
1. Create client
2. Set billing rates for employees
3. Employees log work hours on project
4. Generate invoice from work hours
5. Invoice includes all work hours
6. Record payment
7. Invoice status updated

**Expected Result:**
- Complete billing cycle works
- Invoice generation accurate
- Payment tracking works

---

#### Test 3.1.4: Complete Budget Tracking Workflow
**Test Steps:**
1. Set project budget
2. Employees log work hours
3. Track project costs
4. View budget vs actual
5. View profitability report
6. Verify all calculations correct

**Expected Result:**
- Budget tracking works
- Cost tracking accurate
- Reports correct

---

## Phase 4: Error Handling & Edge Cases

### 4.1 API Error Handling

#### Test 4.1.1: Invalid Authentication
**Test Steps:**
1. Send API request without token
2. Send API request with invalid token
3. Send API request with expired token

**Expected Result:**
- 401 Unauthorized response
- Clear error message
- No data exposed

---

#### Test 4.1.2: Invalid Input Data
**Test Steps:**
1. Send requests with missing required fields
2. Send requests with invalid data types
3. Send requests with invalid date formats
4. Send requests with negative numbers where not allowed

**Expected Result:**
- 400 Bad Request response
- Clear validation error messages
- No data corrupted

---

#### Test 4.1.3: Database Errors
**Test Steps:**
1. Test with non-existent IDs
2. Test with foreign key violations
3. Test with duplicate entries
4. Test with database connection issues

**Expected Result:**
- Appropriate error responses
- Error messages clear
- No system crashes

---

### 4.2 Frontend Error Handling

#### Test 4.2.1: Network Errors
**Test Steps:**
1. Disconnect network
2. Try to load data
3. Try to submit forms

**Expected Result:**
- Error messages displayed
- User-friendly messages
- No blank screens

---

#### Test 4.2.2: Form Validation
**Test Steps:**
1. Submit forms with empty required fields
2. Submit forms with invalid data
3. Submit forms with invalid formats

**Expected Result:**
- Validation errors shown
- Fields highlighted
- Submission prevented

---

#### Test 4.2.3: Loading States
**Test Steps:**
1. Trigger slow API calls
2. Verify loading indicators shown
3. Verify loading states clear after response

**Expected Result:**
- Loading indicators visible
- User feedback provided
- States managed correctly

---

## Test Checklist Summary

### Backend API Testing
- [ ] Authentication & Authorization (1.1)
- [ ] Overtime Management (1.2) - 4 tests
- [ ] Leave Balance Management (1.3) - 4 tests
- [ ] Shift Management (1.4) - 5 tests
- [ ] Payroll Export (1.5) - 5 tests
- [ ] Budget Tracking (1.6) - 4 tests
- [ ] Billing & Invoicing (1.7) - 5 tests
- [ ] Productivity Metrics (1.8) - 4 tests
- [ ] Approval Workflows (1.9) - 5 tests
- [ ] Automated Reports (1.10) - 4 tests

**Total Backend Tests: 45+**

### Frontend Component Testing
- [ ] Overtime Management (2.1) - 4 tests
- [ ] Leave Balance (2.2) - 4 tests
- [ ] Shift Management (2.3) - 4 tests
- [ ] Payroll Export (2.4) - 4 tests
- [ ] Budget Tracking (2.5) - 4 tests
- [ ] Billing Management (2.6) - 5 tests
- [ ] Productivity Dashboard (2.7) - 4 tests
- [ ] Approval Center (2.8) - 5 tests

**Total Frontend Tests: 34+**

### Integration Testing
- [ ] Complete Overtime Workflow (3.1.1)
- [ ] Complete Leave Workflow (3.1.2)
- [ ] Complete Billing Workflow (3.1.3)
- [ ] Complete Budget Tracking Workflow (3.1.4)

**Total Integration Tests: 4+**

### Error Handling
- [ ] API Error Handling (4.1) - 3 test categories
- [ ] Frontend Error Handling (4.2) - 3 test categories

**Total Error Handling Tests: 6+ categories**

---

## Test Execution Log Template

```
Date: ___________
Tester: ___________
Feature: ___________
Test ID: ___________

Test Steps:
1. ___________
2. ___________
3. ___________

Expected Result: ___________

Actual Result: ___________

Status: [ ] Pass [ ] Fail [ ] Blocked

Notes: ___________

Screenshots: ___________
```

---

## Reporting Issues

When reporting issues, include:
1. Test ID and description
2. Steps to reproduce
3. Expected vs actual result
4. Screenshots/error messages
5. Browser/OS information
6. API request/response (if applicable)
7. Console errors (if applicable)

---

## Test Completion Criteria

All tests should be:
- [ ] Executed at least once
- [ ] Documented with results
- [ ] Issues logged and tracked
- [ ] Critical issues resolved
- [ ] Regression testing completed after fixes

---

**Last Updated:** [Date]
**Version:** 1.0
**Status:** Ready for Testing

