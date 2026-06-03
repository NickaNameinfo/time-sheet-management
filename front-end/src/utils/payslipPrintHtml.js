import {
  formatPayslipAmount,
  parsePayslipAmount,
  amountInWordsRupees,
  sumEarnings,
  sumDeductions,
  formatPayPeriod,
  formatDoj,
} from "./payslipFormat";

const TD =
  "border:1px solid #000;padding:6px 10px;font-size:13px;font-family:Arial,Helvetica,sans-serif;vertical-align:middle;";
const GRAY = "background:#d9d9d9;";

function amountCell(value, { dashIfZero, emptyIfZero, gray, bold } = {}) {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && String(value).includes(",")
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
  const extra = `${gray ? GRAY : ""}${bold ? "font-weight:700;" : ""}text-align:right;`;
  return `<td style="${TD}${extra}">${text}</td>`;
}

function labelCell(content, { colSpan, gray, bold, align = "left" } = {}) {
  const cs = colSpan ? `colspan="${colSpan}"` : "";
  const extra = `${gray ? GRAY : ""}${bold ? "font-weight:700;" : ""}text-align:${align};`;
  return `<td ${cs} style="${TD}${extra}">${content}</td>`;
}

/**
 * Self-contained HTML for print / Save as PDF (MUI sx styles are not in innerHTML).
 */
export function buildPayslipPrintHtml({
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
  const gross = sumEarnings(earnings);
  const totalDeduction = sumDeductions(deductions);
  const monthPayable =
    parseFloat(attendancePay.monthPayable) ||
    Number(parseFloat(attendancePay.regularPay || 0).toFixed(2)) ||
    gross;
  const net =
    inHandSalary != null && inHandSalary !== ""
      ? parseFloat(inHandSalary)
      : Math.max(0, monthPayable - totalDeduction);

  const payPeriodStr = formatPayPeriod(period.startDate, period.endDate);
  const doj = formatDoj(employee.dojText || employee.dateOfJoining);

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
    ["Advance", "advance", { dashIfZero: true }],
    ["Mediclaim", "mediclaim", { emptyIfZero: true }],
    ["TDS", "tds", { emptyIfZero: true }],
    ["Other Deduction", "otherDeduction", { emptyIfZero: true }],
    ["Professional Tax", "professionalTax", { emptyIfZero: true }],
    ["", null],
    ["", null],
  ];
  const rowCount = Math.max(earningsRows.length, deductionRows.length);

  let attendanceRow = "";
  const ap = attendancePay || {};
  if (
    (parseFloat(ap.regularPay) || 0) > 0 ||
    (parseFloat(ap.holidayPay) || 0) > 0 ||
    (parseFloat(ap.weekendPay) || 0) > 0 ||
    (parseFloat(ap.extraPay) || 0) > 0
  ) {
    attendanceRow = `<tr>
      ${labelCell(
        `Regular pay: ${formatPayslipAmount(ap.regularPay)}` +
          (parseFloat(ap.holidayPay) > 0
            ? ` · Govt holiday pay: ${formatPayslipAmount(ap.holidayPay)}`
            : "") +
          ` · Weekend (not in payable): ${formatPayslipAmount(ap.weekendPay)}` +
          (parseFloat(ap.extraPay) > 0
            ? ` · Extra (not in payable): ${formatPayslipAmount(ap.extraPay)}`
            : ""),
        { colSpan: 2 }
      )}
    </tr>`;
  }

  const salarySummaryRow =
    parseFloat(monthlySalary) > 0
      ? `<tr>
      ${labelCell(`Total salary (employee details) : <strong>${formatPayslipAmount(monthlySalary)}</strong>`)}
      ${labelCell(`This month payable : <strong>${formatPayslipAmount(monthPayable)}</strong>`)}
    </tr>`
      : "";

  const bodyRows = Array.from({ length: rowCount })
    .map((_, i) => {
      const earn = earningsRows[i];
      const ded = deductionRows[i];
      const earnLabel = earn ? earn[0] : "";
      const earnAmt = earn ? amountCell(earnings[earn[1]]) : labelCell("", { align: "right" });
      const dedLabel = ded && ded[0] ? ded[0] : "";
      const dedAmt =
        ded && ded[1]
          ? amountCell(deductions[ded[1]], ded[2] || {})
          : labelCell("", { align: "right" });
      return `<tr>${labelCell(earnLabel)}${earnAmt}${labelCell(dedLabel)}${dedAmt}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Salary Slip — ${employee.employeeName || "Employee"}</title>
  <style>
    @page { margin: 12mm; size: A4; }
    body { margin: 0; padding: 16px; color: #000; background: #fff; }
    .slip { max-width: 820px; margin: 0 auto; border: 2px solid #000; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .header { text-align: center; border-bottom: 1px solid #000; padding: 12px 16px; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 700; }
    .header p { margin: 4px 0 0; font-size: 12px; }
    .title-bar { ${GRAY} text-align: center; font-weight: 700; font-size: 14px; padding: 8px; border-bottom: 1px solid #000; }
    .signatures { display: flex; justify-content: space-between; border-top: 1px solid #000; padding: 24px 16px; font-size: 13px; }
    .payment { border-top: 1px solid #000; padding: 12px 16px; font-size: 13px; }
    .payment h3 { margin: 0 0 6px; font-size: 13px; font-weight: 700; }
    .payment p { margin: 2px 0; }
    @media print {
      body { padding: 0; }
      .slip { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="slip">
    <div class="header">
      <h1>${company.name || "Company Name"}</h1>
      ${company.address ? `<p>${company.address}</p>` : ""}
      ${company.phone ? `<p>${company.phone}</p>` : ""}
    </div>
    <div class="title-bar">Salary Slip</div>
    <table>
      <tbody>
        <tr>
          ${labelCell(`Employee Name: <strong>${employee.employeeName || "—"}</strong>`)}
          ${labelCell(`Employee ID : <strong>${employee.empId || "—"}</strong>`)}
        </tr>
        <tr>
          ${labelCell(`D O J <strong>${doj || "—"}</strong>`)}
          ${labelCell(`Designation <strong>${employee.designation || "—"}</strong>`)}
        </tr>
        <tr>
          ${labelCell(`Pay Period : <strong>${payPeriodStr}</strong>`, { colSpan: 2 })}
        </tr>
        ${salarySummaryRow}
        ${attendanceRow}
      </tbody>
    </table>
    <table>
      <colgroup>
        <col style="width:32%" />
        <col style="width:18%" />
        <col style="width:32%" />
        <col style="width:18%" />
      </colgroup>
      <tbody>
        <tr>
          ${labelCell("Earnings", { gray: true, bold: true, align: "center" })}
          ${labelCell("Amount", { gray: true, bold: true, align: "center" })}
          ${labelCell("Deductions", { gray: true, bold: true, align: "center" })}
          ${labelCell("Amount", { gray: true, bold: true, align: "center" })}
        </tr>
        ${bodyRows}
        <tr>
          ${labelCell("Gross Salary (month payable)", { gray: true, bold: true })}
          ${amountCell(monthPayable || gross, { gray: true, bold: true })}
          ${labelCell("Total Deduction", { gray: true, bold: true })}
          ${amountCell(totalDeduction, { gray: true, bold: true })}
        </tr>
        <tr>
          ${labelCell("In Hand Salary", { gray: true, bold: true, colSpan: 2 })}
          <td colspan="2" style="${TD}${GRAY}font-weight:700;text-align:right;">${formatPayslipAmount(net)}</td>
        </tr>
        <tr>
          ${labelCell(`(Rupees ${amountInWordsRupees(net).replace(/ only$/, "")} only)`, {
            colSpan: 4,
            align: "center",
            bold: true,
          })}
        </tr>
      </tbody>
    </table>
    <div class="payment">
      <h3>Payment Information</h3>
      <p>Chq. Number: ${payment.chqNumber || "Account Transfer"}</p>
      <p>Chq./ Account Transfer Date: ${payment.chqDate || "—"}</p>
      <p>Name of Bank: ${payment.bankName || "—"}</p>
    </div>
    <div class="signatures">
      <span>Employee Signature:</span>
      <span>Employer Signature :</span>
    </div>
  </div>
</body>
</html>`;
}

/** Open print dialog (user can choose Save as PDF). */
export function printPayslipDocument(html) {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) {
    window.alert("Please allow pop-ups to print or download the payslip.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  const trigger = () => {
    try {
      win.print();
    } catch {
      /* ignore */
    }
  };
  if (win.document.readyState === "complete") {
    setTimeout(trigger, 300);
  } else {
    win.onload = () => setTimeout(trigger, 300);
  }
}
