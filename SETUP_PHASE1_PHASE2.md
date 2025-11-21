# Phase 1 & 2 Setup Guide

## Quick Setup Instructions

### Step 1: Database Migration

Run the database migration to create all new tables:

```bash
cd back-end
mysql -u root -p signup < database/migrations.sql
```

Or manually execute the SQL file in your MySQL client.

### Step 2: Environment Configuration

Update your `.env` file in `back-end/` directory:

```env
# Existing config...
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=signup
DB_NAME_BIOMETRIC=epushserver
JWT_SECRET_KEY=your-secret-key
PORT=8081

# New: Email Configuration (for Automated Reports)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourcompany.com
```

**Note:** For Gmail, you need to use an App Password, not your regular password.

### Step 3: Install Dependencies

Dependencies are already installed, but verify:

```bash
cd back-end
npm install
```

### Step 4: Start Server

```bash
npm start
```

You should see:
```
Connected to primary database
Connected to biometric database
Server running on port 8081
Environment: development
```

### Step 5: Test APIs

Test a few endpoints to verify everything works:

```bash
# Get OT Rules
curl http://localhost:8000/overtime/rules

# Get Shifts
curl http://localhost:8000/shifts

# Get Clients (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/clients
```

---

## Feature Testing Checklist

### Overtime
- [ ] Create OT rules
- [ ] Calculate OT for employee
- [ ] View OT records
- [ ] Approve/reject OT

### Leave Balance
- [ ] Initialize leave balance
- [ ] Accrue leave
- [ ] View leave balance
- [ ] Upload leave document

### Shifts
- [ ] Create shifts
- [ ] Assign shifts to employees
- [ ] Request shift swap
- [ ] Approve shift swap

### Payroll
- [ ] Generate payroll summary
- [ ] Export to Excel
- [ ] Export to PDF
- [ ] Export to Tally
- [ ] Export to QuickBooks

### Budget
- [ ] Set project budget
- [ ] Track project costs
- [ ] View budget vs actual
- [ ] View profitability report

### Billing
- [ ] Create client
- [ ] Set billing rates
- [ ] Generate invoice
- [ ] Record payment

### Productivity
- [ ] Calculate productivity
- [ ] View productivity metrics
- [ ] View team productivity
- [ ] View productivity trends

### Approvals
- [ ] Create approval workflow
- [ ] Approve/reject entity
- [ ] View pending approvals
- [ ] Bulk approve

### Reports
- [ ] Create report schedule
- [ ] Generate report
- [ ] Send report via email

---

## API Documentation

### Overtime Endpoints

**Get OT Rules**
```
GET /overtime/rules?country=UAE
```

**Calculate Overtime**
```
POST /overtime/calculate
Body: {
  "employeeId": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

**Get OT Records**
```
GET /overtime/records?employeeId=1&startDate=2024-01-01&endDate=2024-01-31
```

**Approve OT**
```
POST /overtime/approve/:id
Body: {
  "status": "approved",
  "approverId": 1,
  "comments": "Approved"
}
```

### Leave Balance Endpoints

**Get Leave Balance**
```
GET /leave/balance?employeeId=1&year=2024
```

**Initialize Leave Balance**
```
POST /leave/balance/initialize
Body: {
  "employeeId": 1,
  "leaveType": "annual",
  "initialBalance": 21,
  "year": 2024
}
```

**Accrue Leave**
```
POST /leave/accrue
Body: {
  "employeeId": 1,
  "leaveType": "annual",
  "accrualAmount": 1.75,
  "accrualType": "monthly"
}
```

### Shift Endpoints

**Create Shift**
```
POST /shifts
Body: {
  "name": "Morning Shift",
  "startTime": "08:00:00",
  "endTime": "17:00:00",
  "breakDuration": 60
}
```

**Assign Shift**
```
POST /shifts/assign
Body: {
  "employeeId": 1,
  "shiftId": 1,
  "assignmentDate": "2024-01-01"
}
```

### Payroll Endpoints

**Generate Payroll Summary**
```
GET /payroll/summary?startDate=2024-01-01&endDate=2024-01-31&format=excel
```

**Export to Tally**
```
GET /payroll/export/tally?startDate=2024-01-01&endDate=2024-01-31
```

### Budget Endpoints

**Set Project Budget**
```
POST /projects/:projectId/budget
Body: {
  "budgetAmount": 100000,
  "budgetHours": 1000,
  "currency": "AED"
}
```

**Get Budget vs Actual**
```
GET /projects/:projectId/budget-vs-actual
```

### Billing Endpoints

**Create Client**
```
POST /clients
Body: {
  "clientName": "ABC Company",
  "contactPerson": "John Doe",
  "email": "john@abc.com",
  "paymentTerms": "net_30"
}
```

**Generate Invoice**
```
POST /invoices/generate
Body: {
  "clientId": 1,
  "projectId": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "taxRate": 5
}
```

### Productivity Endpoints

**Calculate Productivity**
```
POST /productivity/calculate
Body: {
  "employeeId": 1,
  "date": "2024-01-15"
}
```

**Get Team Productivity**
```
GET /productivity/team?teamLeadId=1&startDate=2024-01-01&endDate=2024-01-31
```

### Approval Endpoints

**Get Pending Approvals**
```
GET /approvals/pending?approverId=1
```

**Approve Entity**
```
POST /approvals/leave/:entityId
Body: {
  "approverId": 1,
  "status": "approved",
  "comments": "Approved"
}
```

### Report Endpoints

**Create Report Schedule**
```
POST /reports/schedules
Body: {
  "reportType": "weekly",
  "reportName": "Weekly Summary",
  "recipients": [{"email": "admin@company.com"}],
  "scheduleConfig": {
    "frequency": "weekly",
    "time": "09:00",
    "day": "monday"
  }
}
```

---

## Common Issues & Solutions

### Issue: Database Connection Error
**Solution:** Verify database credentials in `.env` file

### Issue: Email Not Sending
**Solution:** 
- Check SMTP credentials
- For Gmail, use App Password
- Verify SMTP port (587 for TLS)

### Issue: OT Calculation Returns 0
**Solution:**
- Verify work details have `status = 'approved'`
- Check date range
- Verify OT rules are configured

### Issue: Leave Balance Not Found
**Solution:**
- Initialize leave balance first
- Check year parameter
- Verify employee ID

---

## Next Steps

1. ✅ Backend APIs are ready
2. ⏳ Frontend components need to be created
3. ⏳ UI integration
4. ⏳ Testing
5. ⏳ Documentation

---

**All Phase 1 & 2 backend features are implemented and ready to use!** 🎉

