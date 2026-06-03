import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import {
  formatPayslipAmount,
  parsePayslipAmount,
  amountInWordsRupees,
  sumEarnings,
  sumDeductions,
  formatPayPeriod,
  formatDoj,
} from "../utils/payslipFormat";

const cellBorder = "1px solid #000";
const grayBg = "#d9d9d9";

function Cell({ children, sx = {}, colSpan, rowSpan, align = "left", bold, gray }) {
  return (
    <Box
      component="td"
      colSpan={colSpan}
      rowSpan={rowSpan}
      sx={{
        border: cellBorder,
        p: "6px 10px",
        fontSize: 13,
        fontFamily: "Arial, Helvetica, sans-serif",
        verticalAlign: "middle",
        textAlign: align,
        fontWeight: bold ? 700 : 400,
        bgcolor: gray ? grayBg : "transparent",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function AmountCell({ value, gray, bold, emptyIfZero, dashIfZero }) {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.includes(",")
        ? parsePayslipAmount(value)
        : parseFloat(value);
  const isZero = Number.isNaN(n) || n === 0;
  let text = "";
  if (isZero) {
    if (emptyIfZero) text = "";
    else if (dashIfZero) text = "-";
  } else {
    text = formatPayslipAmount(n);
  }
  return (
    <Cell align="right" gray={gray} bold={bold}>
      {text}
    </Cell>
  );
}

/**
 * Formal salary slip layout (print-ready) matching standard Indian payslip design.
 */
export default function EmployeePayslipForm({
  company = {},
  employee = {},
  period = {},
  earnings = {},
  deductions = {},
  payment = {},
  inHandSalary,
  monthlySalary,
  attendancePay = {},
}) {
  const gross = useMemo(() => sumEarnings(earnings), [earnings]);
  const totalDeduction = useMemo(() => sumDeductions(deductions), [deductions]);
  const monthPayable =
    parseFloat(attendancePay.monthPayable) ||
    Number(parseFloat(attendancePay.regularPay || 0).toFixed(2)) ||
    gross;
  const net =
    inHandSalary != null && inHandSalary !== ""
      ? parseFloat(inHandSalary)
      : Math.max(0, monthPayable - totalDeduction);

  const earningsRows = [
    ["Basic", "basic"],
    ["HRA", "hra"],
    ["Conveyance Allowance", "conveyanceAllowance"],
    ["Food Allowance/Coupons", "foodAllowance"],
    ["Medical Expenses", "medicalExpenses"],
    ["Mobile Allowance", "mobileAllowance"],
    ["Special Allowance", "specialAllowance"],
  ];

  const deductionRows = [
    ["Advance", "advance"],
    ["Mediclaim", "mediclaim"],
    ["TDS", "tds"],
    ["Other Deduction", "otherDeduction"],
    ["Professional Tax", "professionalTax"],
    ["", null],
    ["", null],
  ];

  const rowCount = Math.max(earningsRows.length, deductionRows.length);

  const payPeriodStr = formatPayPeriod(period.startDate, period.endDate);

  return (
    <Box
      className="employee-payslip-form"
      sx={{
        maxWidth: 820,
        mx: "auto",
        border: "2px solid #000",
        bgcolor: "#fff",
        color: "#000",
        "@media print": {
          maxWidth: "100%",
          border: "2px solid #000",
          pageBreakInside: "avoid",
        },
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: "center", borderBottom: cellBorder, py: 1.5, px: 2 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 18,
            fontFamily: "Arial, Helvetica, sans-serif",
            lineHeight: 1.3,
          }}
        >
          {company.name || "Company Name"}
        </Typography>
        {company.address && (
          <Typography sx={{ fontSize: 12, mt: 0.5, fontFamily: "Arial, Helvetica, sans-serif" }}>
            {company.address}
          </Typography>
        )}
        {company.phone && (
          <Typography sx={{ fontSize: 12, fontFamily: "Arial, Helvetica, sans-serif" }}>
            {company.phone}
          </Typography>
        )}
      </Box>

      <Box sx={{ bgcolor: grayBg, borderBottom: cellBorder, py: 0.75, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14, fontFamily: "Arial, Helvetica, sans-serif" }}>
          Salary Slip
        </Typography>
      </Box>

      {/* Employee info */}
      <Box
        component="table"
        sx={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}
      >
        <tbody>
          <tr>
            <Cell sx={{ width: "50%" }}>
              Employee Name: <strong>{employee.employeeName || "—"}</strong>
            </Cell>
            <Cell sx={{ width: "50%" }}>
              Employee ID : <strong>{employee.empId || "—"}</strong>
            </Cell>
          </tr>
          <tr>
            <Cell>
              D O J <strong>{formatDoj(employee.dojText || employee.dateOfJoining)}</strong>
            </Cell>
            <Cell>
              Designation <strong>{employee.designation || "—"}</strong>
            </Cell>
          </tr>
          <tr>
            <Cell colSpan={2}>
              Pay Period : <strong>{payPeriodStr}</strong>
            </Cell>
          </tr>
          {monthlySalary > 0 && (
            <tr>
              <Cell>
                Total salary (employee details) : <strong>{formatPayslipAmount(monthlySalary)}</strong>
              </Cell>
              <Cell>
                This month payable : <strong>{formatPayslipAmount(monthPayable)}</strong>
              </Cell>
            </tr>
          )}
          {(attendancePay.regularPay > 0 ||
            attendancePay.holidayPay > 0 ||
            attendancePay.weekendPay > 0 ||
            attendancePay.extraPay > 0) && (
            <tr>
              <Cell colSpan={2} sx={{ fontSize: 12 }}>
                Regular pay: {formatPayslipAmount(attendancePay.regularPay)}
                {attendancePay.holidayPay > 0 && (
                  <> · Govt holiday pay: {formatPayslipAmount(attendancePay.holidayPay)}</>
                )}
                {" "}
                · Weekend (not in payable): {formatPayslipAmount(attendancePay.weekendPay)}
                {attendancePay.extraPay > 0 && (
                  <> · Extra (not in payable): {formatPayslipAmount(attendancePay.extraPay)}</>
                )}
              </Cell>
            </tr>
          )}
        </tbody>
      </Box>

      {/* Earnings / Deductions */}
      <Box
        component="table"
        sx={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}
      >
        <colgroup>
          <col style={{ width: "32%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "32%" }} />
          <col style={{ width: "18%" }} />
        </colgroup>
        <tbody>
          <tr>
            <Cell gray bold align="center">
              Earnings
            </Cell>
            <Cell gray bold align="center">
              Amount
            </Cell>
            <Cell gray bold align="center">
              Deductions
            </Cell>
            <Cell gray bold align="center">
              Amount
            </Cell>
          </tr>
          {Array.from({ length: rowCount }).map((_, i) => {
            const earn = earningsRows[i];
            const ded = deductionRows[i];
            return (
              <tr key={i}>
                <Cell>{earn ? earn[0] : ""}</Cell>
                {earn ? <AmountCell value={earnings[earn[1]]} /> : <Cell align="right" />}
                <Cell>{ded && ded[0] ? ded[0] : ""}</Cell>
                {ded && ded[1] ? (
                  <AmountCell
                    value={deductions[ded[1]]}
                    dashIfZero={ded[1] === "advance"}
                    emptyIfZero={ded[1] === "tds" || ded[1] === "professionalTax"}
                  />
                ) : (
                  <Cell align="right" />
                )}
              </tr>
            );
          })}
          <tr>
            <Cell gray bold>
              Gross Salary (month payable)
            </Cell>
            <Cell align="right" gray bold>
              {formatPayslipAmount(monthPayable || gross)}
            </Cell>
            <Cell gray bold>
              Total Deduction
            </Cell>
            <Cell align="right" gray bold>
              {formatPayslipAmount(totalDeduction)}
            </Cell>
          </tr>
          <tr>
            <Cell gray bold colSpan={2}>
              In Hand Salary
            </Cell>
            <Cell align="right" gray bold colSpan={2}>
              {formatPayslipAmount(net)}
            </Cell>
          </tr>
          <tr>
            <Cell colSpan={4} align="center" bold sx={{ py: 1 }}>
              (Rupees {amountInWordsRupees(net).replace(/ only$/, "")} only)
            </Cell>
          </tr>
        </tbody>
      </Box>

      {/* Payment information */}
      <Box sx={{ borderTop: cellBorder, p: 1.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.5, fontFamily: "Arial, Helvetica, sans-serif" }}>
          Payment Information
        </Typography>
        <Typography sx={{ fontSize: 13, fontFamily: "Arial, Helvetica, sans-serif" }}>
          Chq. Number: {payment.chqNumber || "Account Transfer"}
        </Typography>
        <Typography sx={{ fontSize: 13, fontFamily: "Arial, Helvetica, sans-serif" }}>
          Chq./ Account Transfer Date: {payment.chqDate || "—"}
        </Typography>
        <Typography sx={{ fontSize: 13, fontFamily: "Arial, Helvetica, sans-serif" }}>
          Name of Bank: {payment.bankName || "—"}
        </Typography>
      </Box>

      {/* Signatures */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: cellBorder,
          px: 2,
          py: 3,
          mt: 0,
        }}
      >
        <Typography sx={{ fontSize: 13, fontFamily: "Arial, Helvetica, sans-serif" }}>
          Employee Signature:
        </Typography>
        <Typography sx={{ fontSize: 13, fontFamily: "Arial, Helvetica, sans-serif" }}>
          Employer Signature :
        </Typography>
      </Box>
    </Box>
  );
}
