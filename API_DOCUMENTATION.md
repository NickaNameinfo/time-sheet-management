# API Documentation - Phase 1 & 2 Features

## Base URL
```
http://localhost:8000
```

All endpoints require authentication unless specified. Include token in request body or Authorization header.

---

## Overtime Management

### Get OT Rules
```http
GET /overtime/rules?country=UAE
```

**Response:**
```json
{
  "Status": "Success",
  "Result": [{
    "id": 1,
    "country": "UAE",
    "daily_hours_limit": 8.00,
    "weekly_hours_limit": 48.00,
    "friday_multiplier": 1.50,
    "holiday_multiplier": 2.00,
    "night_shift_multiplier": 1.25
  }]
}
```

### Calculate Overtime
```http
POST /overtime/calculate
Content-Type: application/json

{
  "employeeId": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

**Response:**
```json
{
  "Status": "Success",
  "Result": {
    "employeeId": 1,
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "totalOTHours": 15.5,
    "dailyOT": 10.0,
    "weeklyOT": 5.5,
    "hourlyRate": 100,
    "estimatedOTAmount": 2325.00
  }
}
```

### Get OT Records
```http
GET /overtime/records?employeeId=1&startDate=2024-01-01&endDate=2024-01-31&status=approved
```

### Approve OT
```http
POST /overtime/approve/:id
Content-Type: application/json

{
  "status": "approved",
  "approverId": 1,
  "comments": "Approved"
}
```

---

## Leave Balance Management

### Get Leave Balance
```http
GET /leave/balance?employeeId=1&year=2024
```

**Response:**
```json
{
  "Status": "Success",
  "Result": [{
    "id": 1,
    "employeeId": 1,
    "leaveType": "annual",
    "balance": 15.5,
    "accrued": 21.0,
    "used": 5.5,
    "year": 2024
  }]
}
```

### Initialize Leave Balance
```http
POST /leave/balance/initialize
Content-Type: application/json

{
  "employeeId": 1,
  "leaveType": "annual",
  "initialBalance": 21,
  "year": 2024
}
```

### Accrue Leave
```http
POST /leave/accrue
Content-Type: application/json

{
  "employeeId": 1,
  "leaveType": "annual",
  "accrualAmount": 1.75,
  "accrualType": "monthly",
  "comments": "Monthly accrual"
}
```

### Use Leave (Deduct Balance)
```http
POST /leave/use
Content-Type: application/json

{
  "employeeId": 1,
  "leaveType": "annual",
  "leaveHours": 8,
  "year": 2024
}
```

---

## Shift Management

### Get Shifts
```http
GET /shifts?isActive=true
```

### Create Shift
```http
POST /shifts
Content-Type: application/json

{
  "name": "Morning Shift",
  "startTime": "08:00:00",
  "endTime": "17:00:00",
  "breakDuration": 60,
  "breakStart": "13:00:00",
  "isNightShift": false
}
```

### Assign Shift to Employee
```http
POST /shifts/assign
Content-Type: application/json

{
  "employeeId": 1,
  "shiftId": 1,
  "assignmentDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

### Get Shift Assignments
```http
GET /shifts/assignments?employeeId=1&startDate=2024-01-01&endDate=2024-12-31
```

### Request Shift Swap
```http
POST /shifts/swap
Content-Type: application/json

{
  "requesterId": 1,
  "swapWithId": 2,
  "originalShiftDate": "2024-01-15",
  "swapShiftDate": "2024-01-16",
  "comments": "Need to swap shifts"
}
```

---

## Payroll Export

### Generate Payroll Summary
```http
GET /payroll/summary?employeeId=1&startDate=2024-01-01&endDate=2024-01-31&format=excel
```

**Formats:** `json` (default), `excel`, `pdf`

### Export to Tally
```http
GET /payroll/export/tally?startDate=2024-01-01&endDate=2024-01-31
```

**Response:** CSV file download

### Export to QuickBooks
```http
GET /payroll/export/quickbooks?startDate=2024-01-01&endDate=2024-01-31
```

**Response:** IIF file download

---

## Project Budget Tracking

### Set Project Budget
```http
POST /projects/:projectId/budget
Content-Type: application/json

{
  "budgetAmount": 100000,
  "budgetHours": 1000,
  "currency": "AED",
  "budgetType": "total",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

### Track Project Cost
```http
POST /projects/:projectId/costs
Content-Type: application/json

{
  "costDate": "2024-01-15",
  "employeeCost": 5000,
  "overheadCost": 1000,
  "materialCost": 2000,
  "hoursSpent": 50
}
```

### Get Budget vs Actual
```http
GET /projects/:projectId/budget-vs-actual
```

**Response:**
```json
{
  "Status": "Success",
  "Result": {
    "projectId": 1,
    "budget": {
      "amount": 100000,
      "hours": 1000
    },
    "actual": {
      "cost": 75000,
      "hours": 750
    },
    "variance": {
      "amount": 25000,
      "percent": "25.00",
      "hours": 250,
      "hoursPercent": "25.00"
    },
    "status": "under_budget"
  }
}
```

### Get Profitability Report
```http
GET /projects/:projectId/profitability
```

**Response:**
```json
{
  "Status": "Success",
  "Result": {
    "projectId": 1,
    "projectName": "Project ABC",
    "revenue": 120000,
    "cost": 75000,
    "profit": 45000,
    "margin": "37.50",
    "roi": "60.00",
    "status": "profitable"
  }
}
```

---

## Client Billing & Invoicing

### Create Client
```http
POST /clients
Content-Type: application/json

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
  "taxId": "TAX123456"
}
```

### Create Billing Rate
```http
POST /billing/rates
Content-Type: application/json

{
  "employeeId": 1,
  "designation": "Engineer",
  "disciplineCode": "CIV",
  "projectId": 1,
  "hourlyRate": 150,
  "otRateMultiplier": 1.5,
  "effectiveDate": "2024-01-01"
}
```

### Generate Invoice
```http
POST /invoices/generate
Content-Type: application/json

{
  "clientId": 1,
  "projectId": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "taxRate": 5
}
```

**Response:**
```json
{
  "Status": "Success",
  "Result": {
    "id": 1,
    "invoiceNumber": "INV-1234567890-1",
    "clientId": 1,
    "projectId": 1,
    "invoiceDate": "2024-01-31",
    "dueDate": "2024-03-01",
    "subtotal": 15000,
    "taxRate": 5,
    "taxAmount": 750,
    "totalAmount": 15750,
    "status": "draft",
    "items": [...]
  }
}
```

### Get Invoices
```http
GET /invoices?clientId=1&status=paid&startDate=2024-01-01&endDate=2024-12-31
```

### Record Payment
```http
POST /invoices/:invoiceId/payments
Content-Type: application/json

{
  "paymentDate": "2024-02-15",
  "amount": 15750,
  "paymentMethod": "bank_transfer",
  "referenceNumber": "TXN123456",
  "notes": "Payment received"
}
```

---

## Productivity Metrics

### Calculate Productivity
```http
POST /productivity/calculate
Content-Type: application/json

{
  "employeeId": 1,
  "date": "2024-01-15"
}
```

**Response:**
```json
{
  "Status": "Success",
  "Result": {
    "employeeId": 1,
    "date": "2024-01-15",
    "totalHours": 8.0,
    "productiveHours": 7.5,
    "idleTimeMinutes": 30,
    "tasksCompleted": 5,
    "tasksAssigned": 6,
    "productivityScore": "93.75",
    "taskCompletionRate": "83.33"
  }
}
```

### Get Team Productivity
```http
GET /productivity/team?teamLeadId=1&startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "Status": "Success",
  "Result": {
    "teamLeadId": 1,
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "teamMetrics": [
      {
        "employeeId": 1,
        "employeeName": "John Doe",
        "avgProductivity": "85.50",
        "avgCompletionRate": "90.00",
        "totalHours": "160.00",
        "daysWorked": 20
      }
    ],
    "teamAverage": {
      "avgProductivity": "82.50",
      "avgCompletionRate": "88.00",
      "totalHours": "800.00"
    }
  }
}
```

---

## Approval Workflows

### Get Pending Approvals
```http
GET /approvals/pending?approverId=1&entityType=leave
```

**Response:**
```json
{
  "Status": "Success",
  "Result": [
    {
      "entityType": "leave",
      "entityId": 1,
      "entity": {
        "id": 1,
        "employeeName": "John Doe",
        "leaveType": "annual",
        "leaveFrom": "2024-02-01",
        "leaveTo": "2024-02-05"
      },
      "requestedBy": "John Doe",
      "requestedDate": "2024-02-01"
    }
  ]
}
```

### Approve Entity
```http
POST /approvals/leave/:entityId
Content-Type: application/json

{
  "approverId": 1,
  "status": "approved",
  "comments": "Approved",
  "approvalLevel": 1
}
```

### Bulk Approve
```http
POST /approvals/bulk
Content-Type: application/json

{
  "entityType": "overtime",
  "entityIds": [1, 2, 3],
  "approverId": 1,
  "comments": "Bulk approved"
}
```

---

## Automated Reports

### Create Report Schedule
```http
POST /reports/schedules
Content-Type: application/json

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
  }
}
```

### Generate and Send Report
```http
POST /reports/send/:scheduleId
```

### Manual Report Generation
```http
GET /reports/generate?reportType=weekly&startDate=2024-01-01&endDate=2024-01-07&format=email
POST /reports/generate
Content-Type: application/json

{
  "reportType": "monthly",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "format": "email",
  "recipients": ["admin@company.com"]
}
```

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "Status": "Error",
  "Error": "Error message here"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

---

## Authentication

Most endpoints require authentication. Include token in request:

**Option 1: Request Body**
```json
{
  "tokensss": "your-jwt-token",
  ...other data
}
```

**Option 2: Authorization Header**
```
Authorization: Bearer your-jwt-token
```

---

## Rate Limiting

- General API: 100 requests per 15 minutes per IP
- Authentication: 5 requests per 15 minutes per IP
- File Upload: 20 requests per 15 minutes per IP

---

**All APIs are ready for frontend integration!** 🚀

