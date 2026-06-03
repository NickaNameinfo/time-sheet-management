import React from "react";
import { Box, Grid, TextField, Typography, Divider, Paper, Button, Alert } from "@mui/material";
import { Calculate } from "@mui/icons-material";
import { parsePayslipAmount, sumEarnings, sumDeductions, formatPayslipAmount } from "../utils/payslipFormat";

export const EARNING_FIELDS = [
  { key: "basic", label: "Basic" },
  { key: "hra", label: "HRA" },
  { key: "conveyanceAllowance", label: "Conveyance Allowance" },
  { key: "foodAllowance", label: "Food Allowance/Coupons" },
  { key: "medicalExpenses", label: "Medical Expenses" },
  { key: "mobileAllowance", label: "Mobile Allowance" },
  { key: "specialAllowance", label: "Special Allowance" },
];

export const DEDUCTION_FIELDS = [
  { key: "advance", label: "Advance" },
  { key: "mediclaim", label: "Mediclaim" },
  { key: "tds", label: "TDS" },
  { key: "otherDeduction", label: "Other Deduction" },
  { key: "professionalTax", label: "Professional Tax" },
];

function SectionTitle({ children }) {
  return (
    <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1, mb: 1 }}>
      {children}
    </Typography>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <TextField
      label={label}
      type="number"
      value={value === 0 || value ? value : ""}
      onChange={(e) => onChange(parsePayslipAmount(e.target.value))}
      fullWidth
      size="small"
      inputProps={{ min: 0, step: "0.01" }}
    />
  );
}

export default function EmployeePayslipEditor({
  company,
  setCompany,
  employee,
  setEmployee,
  period,
  setPeriod,
  earnings,
  setEarnings,
  deductions,
  setDeductions,
  payment,
  setPayment,
  attendancePay = {},
  inHandOverride,
  setInHandOverride,
  onRecalculateFromAttendance,
}) {
  const profileSalary = parseFloat(attendancePay.totalSalary ?? employee.monthlySalary) || 0;
  const monthPayable = parseFloat(attendancePay.monthPayable) || 0;
  const gross = sumEarnings(earnings);
  const totalDed = sumDeductions(deductions);
  const computedInHand = Math.max(0, (monthPayable || gross) - totalDed);

  const updateEarning = (key, val) => {
    setEarnings((prev) => ({ ...prev, [key]: val }));
  };

  const updateDeduction = (key, val) => {
    setDeductions((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "#fff" }}>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        Edit all payslip fields
      </Typography>

      <SectionTitle>Company header</SectionTitle>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Company name"
            value={company.name || ""}
            onChange={(e) => setCompany({ ...company, name: e.target.value })}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Address"
            value={company.address || ""}
            onChange={(e) => setCompany({ ...company, address: e.target.value })}
            fullWidth
            size="small"
            multiline
            minRows={2}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Phone"
            value={company.phone || ""}
            onChange={(e) => setCompany({ ...company, phone: e.target.value })}
            fullWidth
            size="small"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <SectionTitle>Employee details</SectionTitle>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Employee name"
            value={employee.employeeName || ""}
            onChange={(e) => setEmployee({ ...employee, employeeName: e.target.value })}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Employee ID"
            value={employee.empId || ""}
            onChange={(e) => setEmployee({ ...employee, empId: e.target.value })}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Date of joining (DD.MM.YYYY)"
            value={employee.dojText ?? ""}
            onChange={(e) =>
              setEmployee({
                ...employee,
                dojText: e.target.value,
                dateOfJoining: e.target.value,
              })
            }
            fullWidth
            size="small"
            placeholder="28.03.2022"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Designation"
            value={employee.designation || ""}
            onChange={(e) => setEmployee({ ...employee, designation: e.target.value })}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Pay period start (YYYY-MM-DD)"
            value={period.startDate || ""}
            onChange={(e) => setPeriod({ ...period, startDate: e.target.value })}
            fullWidth
            size="small"
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Pay period end (YYYY-MM-DD)"
            value={period.endDate || ""}
            onChange={(e) => setPeriod({ ...period, endDate: e.target.value })}
            fullWidth
            size="small"
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <SectionTitle>Attendance pay (this period)</SectionTitle>
      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>This month payable</strong> = regular pay + government holiday pay. Weekend and extra pay are for
        reference only.
      </Alert>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Total salary (profile)"
            value={profileSalary || ""}
            fullWidth
            size="small"
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Regular pay"
            value={attendancePay.regularPay ?? ""}
            fullWidth
            size="small"
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Weekend pay"
            value={attendancePay.weekendPay ?? ""}
            fullWidth
            size="small"
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Extra pay (not in payable)"
            value={attendancePay.extraPay ?? ""}
            fullWidth
            size="small"
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Govt holiday pay"
            value={attendancePay.holidayPay ?? ""}
            fullWidth
            size="small"
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="This month payable"
            value={monthPayable || ""}
            fullWidth
            size="small"
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={6} sx={{ display: "flex", alignItems: "center" }}>
          <Button variant="contained" startIcon={<Calculate />} onClick={onRecalculateFromAttendance}>
            Recalculate payslip from attendance
          </Button>
        </Grid>
      </Grid>

      <SectionTitle>Earnings (split from month payable)</SectionTitle>
      <Grid container spacing={2}>
        {EARNING_FIELDS.map(({ key, label }) => (
          <Grid item xs={12} sm={6} md={4} key={key}>
            <NumField label={label} value={earnings[key]} onChange={(v) => updateEarning(key, v)} />
          </Grid>
        ))}
        <Grid item xs={12}>
          <Box sx={{ p: 1, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Gross (sum of earnings):</strong> {formatPayslipAmount(gross)}
              {" · "}
              <strong>Month payable:</strong> {formatPayslipAmount(monthPayable)}
              {monthPayable > 0 && Math.round(gross) !== Math.round(monthPayable) && (
                <Typography component="span" color="warning.main" sx={{ ml: 1 }}>
                  (mismatch — click Recalculate)
                </Typography>
              )}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <SectionTitle>Deductions</SectionTitle>
      <Grid container spacing={2}>
        {DEDUCTION_FIELDS.map(({ key, label }) => (
          <Grid item xs={12} sm={6} md={4} key={key}>
            <NumField label={label} value={deductions[key]} onChange={(v) => updateDeduction(key, v)} />
          </Grid>
        ))}
        <Grid item xs={12}>
          <Box sx={{ p: 1, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Total deduction (auto):</strong> {formatPayslipAmount(totalDed)}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <SectionTitle>Net pay</SectionTitle>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="In hand salary (leave blank = auto)"
            type="number"
            value={inHandOverride === "" || inHandOverride == null ? "" : inHandOverride}
            onChange={(e) => {
              const v = e.target.value;
              setInHandOverride(v === "" ? "" : parsePayslipAmount(v));
            }}
            fullWidth
            size="small"
            helperText={`Computed: ${formatPayslipAmount(computedInHand)}`}
            inputProps={{ min: 0, step: "0.01" }}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <SectionTitle>Payment information</SectionTitle>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Chq. number / mode"
            value={payment.chqNumber || ""}
            onChange={(e) => setPayment({ ...payment, chqNumber: e.target.value })}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Chq. / transfer date"
            value={payment.chqDate || ""}
            onChange={(e) => setPayment({ ...payment, chqDate: e.target.value })}
            fullWidth
            size="small"
            placeholder="01-07-2024"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Name of bank"
            value={payment.bankName || ""}
            onChange={(e) => setPayment({ ...payment, bankName: e.target.value })}
            fullWidth
            size="small"
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
