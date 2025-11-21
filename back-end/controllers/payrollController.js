import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

// Generate Payroll Summary
export const generatePayrollSummary = asyncHandler(async (req, res) => {
  const { employeeId, startDate, endDate, format } = req.query;

  if (!startDate || !endDate) {
    return sendError(res, "startDate and endDate are required", 400);
  }

  // Get employee data
  let employeeSql = "SELECT * FROM employee WHERE 1=1";
  const employeeParams = [];
  if (employeeId) {
    employeeSql += " AND (id = ? OR EMPID = ?)";
    employeeParams.push(employeeId, employeeId);
  }
  const employees = await query(employeeSql, employeeParams);

  const payrollData = [];

  for (const employee of employees) {
    // Get approved work hours
    // workdetails table uses userName to link to employee, not employeeNo
    const workHoursSql = `
      SELECT SUM(totalHours) as total_hours
      FROM workdetails
      WHERE userName = ? 
      AND (
        DATE(STR_TO_DATE(SUBSTRING(sentDate, 1, 10), '%Y-%m-%d')) BETWEEN ? AND ?
        OR DATE(STR_TO_DATE(sentDate, '%Y-%m-%d')) BETWEEN ? AND ?
      )
      AND status = 'approved'
    `;
    const workHours = await query(workHoursSql, [
      employee.userName, 
      startDate, endDate,
      startDate, endDate
    ]);
    const totalHours = parseFloat(workHours[0]?.total_hours || 0);

    // Get OT hours
    const otSql = `
      SELECT SUM(ot_hours) as total_ot, SUM(ot_amount) as total_ot_amount
      FROM ot_records
      WHERE employee_id = ? 
      AND attendance_date BETWEEN ? AND ?
      AND approval_status = 'approved'
    `;
    const otData = await query(otSql, [employee.id, startDate, endDate]);
    const totalOT = parseFloat(otData[0]?.total_ot || 0);
    const totalOTAmount = parseFloat(otData[0]?.total_ot_amount || 0);

    // Get billing rate
    const rateSql = `
      SELECT hourly_rate FROM billing_rates
      WHERE (employee_id = ? OR designation = ? OR discipline_code = ?)
      AND is_active = TRUE
      ORDER BY employee_id DESC, effective_date DESC
      LIMIT 1
    `;
    const rates = await query(rateSql, [employee.id, employee.designation, employee.discipline]);
    const hourlyRate = rates.length > 0 ? parseFloat(rates[0].hourly_rate) : 0;

    // Calculate regular pay
    const regularHours = totalHours - totalOT;
    const regularPay = regularHours * hourlyRate;
    const totalPay = regularPay + totalOTAmount;

    payrollData.push({
      employeeId: employee.EMPID,
      employeeName: employee.employeeName,
      designation: employee.designation,
      regularHours: regularHours.toFixed(2),
      otHours: totalOT.toFixed(2),
      totalHours: totalHours.toFixed(2),
      hourlyRate: hourlyRate.toFixed(2),
      regularPay: regularPay.toFixed(2),
      otPay: totalOTAmount.toFixed(2),
      totalPay: totalPay.toFixed(2),
      period: { startDate, endDate },
    });
  }

  if (format === "excel") {
    return generateExcelPayroll(res, payrollData, startDate, endDate);
  } else if (format === "pdf") {
    return generatePDFPayroll(res, payrollData, startDate, endDate);
  }

  return sendSuccess(res, payrollData);
});

// Generate Excel Payroll
const generateExcelPayroll = async (res, data, startDate, endDate) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Payroll Summary");

  // Add headers
  worksheet.columns = [
    { header: "Employee ID", key: "employeeId", width: 15 },
    { header: "Employee Name", key: "employeeName", width: 25 },
    { header: "Designation", key: "designation", width: 20 },
    { header: "Regular Hours", key: "regularHours", width: 15 },
    { header: "OT Hours", key: "otHours", width: 15 },
    { header: "Total Hours", key: "totalHours", width: 15 },
    { header: "Hourly Rate", key: "hourlyRate", width: 15 },
    { header: "Regular Pay", key: "regularPay", width: 15 },
    { header: "OT Pay", key: "otPay", width: 15 },
    { header: "Total Pay", key: "totalPay", width: 15 },
  ];

  // Add data
  data.forEach((row) => {
    worksheet.addRow(row);
  });

  // Add summary row
  const totalRow = worksheet.addRow({
    employeeId: "TOTAL",
    employeeName: "",
    designation: "",
    regularHours: data.reduce((sum, r) => sum + parseFloat(r.regularHours), 0).toFixed(2),
    otHours: data.reduce((sum, r) => sum + parseFloat(r.otHours), 0).toFixed(2),
    totalHours: data.reduce((sum, r) => sum + parseFloat(r.totalHours), 0).toFixed(2),
    hourlyRate: "",
    regularPay: data.reduce((sum, r) => sum + parseFloat(r.regularPay), 0).toFixed(2),
    otPay: data.reduce((sum, r) => sum + parseFloat(r.otPay), 0).toFixed(2),
    totalPay: data.reduce((sum, r) => sum + parseFloat(r.totalPay), 0).toFixed(2),
  });
  totalRow.font = { bold: true };

  // Set response headers
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=payroll_${startDate}_${endDate}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
};

// Generate PDF Payroll
const generatePDFPayroll = async (res, data, startDate, endDate) => {
  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=payroll_${startDate}_${endDate}.pdf`);

  doc.pipe(res);

  // Add title
  doc.fontSize(20).text("Payroll Summary", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, { align: "center" });
  doc.moveDown(2);

  // Add table headers
  const tableTop = doc.y;
  const itemHeight = 20;
  const pageWidth = doc.page.width;
  const margin = 50;
  const tableWidth = pageWidth - 2 * margin;

  doc.fontSize(10);
  doc.text("Employee ID", margin, tableTop, { width: 80 });
  doc.text("Name", margin + 80, tableTop, { width: 120 });
  doc.text("Hours", margin + 200, tableTop, { width: 60 });
  doc.text("OT Hours", margin + 260, tableTop, { width: 60 });
  doc.text("Total Pay", margin + 320, tableTop, { width: 80 });

  let y = tableTop + itemHeight;
  doc.moveTo(margin, y).lineTo(margin + tableWidth, y).stroke();

  // Add data rows
  data.forEach((row, index) => {
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = margin;
    }

    doc.text(row.employeeId, margin, y, { width: 80 });
    doc.text(row.employeeName, margin + 80, y, { width: 120 });
    doc.text(row.totalHours, margin + 200, y, { width: 60 });
    doc.text(row.otHours, margin + 260, y, { width: 60 });
    doc.text(row.totalPay, margin + 320, y, { width: 80 });

    y += itemHeight;
    doc.moveTo(margin, y).lineTo(margin + tableWidth, y).stroke();
  });

  // Add total
  y += 10;
  doc.font("Helvetica-Bold");
  doc.text("TOTAL", margin + 200, y, { width: 60 });
  doc.text(
    data.reduce((sum, r) => sum + parseFloat(r.totalPay), 0).toFixed(2),
    margin + 320,
    y,
    { width: 80 }
  );

  doc.end();
};

// Export to Tally Format
export const exportToTally = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return sendError(res, "startDate and endDate are required", 400);
  }

  // Get payroll data
  // workdetails table uses userName to link to employee, not employeeNo
  const payrollSql = `
    SELECT 
      e.EMPID,
      e.employeeName,
      SUM(wd.totalHours) as total_hours,
      SUM(ot.ot_hours) as ot_hours,
      SUM(ot.ot_amount) as ot_amount
    FROM employee e
    LEFT JOIN workdetails wd ON e.userName = wd.userName 
      AND (
        DATE(STR_TO_DATE(SUBSTRING(wd.sentDate, 1, 10), '%Y-%m-%d')) BETWEEN ? AND ?
        OR DATE(STR_TO_DATE(wd.sentDate, '%Y-%m-%d')) BETWEEN ? AND ?
      )
      AND wd.status = 'approved'
    LEFT JOIN ot_records ot ON e.id = ot.employee_id 
      AND ot.attendance_date BETWEEN ? AND ? AND ot.approval_status = 'approved'
    GROUP BY e.id, e.EMPID, e.employeeName
  `;

  const data = await query(payrollSql, [
    startDate, endDate,
    startDate, endDate,
    startDate, endDate,
    startDate, endDate
  ]);

  // Generate Tally-compatible format (CSV)
  let csv = "Employee ID,Employee Name,Total Hours,OT Hours,OT Amount\n";
  data.forEach((row) => {
    csv += `${row.EMPID},${row.employeeName},${row.total_hours || 0},${row.ot_hours || 0},${row.ot_amount || 0}\n`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=tally_export_${startDate}_${endDate}.csv`);
  res.send(csv);
});

// Export to QuickBooks Format
export const exportToQuickBooks = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return sendError(res, "startDate and endDate are required", 400);
  }

  // QuickBooks IIF format
  let iif = "!TRNS\tDATE\tACCNT\tAMOUNT\tMEMO\n";
  iif += "!SPL\tDATE\tACCNT\tAMOUNT\tMEMO\n";
  iif += "!ENDTRNS\n";

  // Get payroll data
  // workdetails table uses userName to link to employee, not employeeNo
  const payrollData = await query(`
    SELECT 
      e.EMPID,
      e.employeeName,
      SUM(wd.totalHours * br.hourly_rate) as total_pay,
      SUM(ot.ot_amount) as ot_pay
    FROM employee e
    LEFT JOIN workdetails wd ON e.userName = wd.userName 
      AND (
        DATE(STR_TO_DATE(SUBSTRING(wd.sentDate, 1, 10), '%Y-%m-%d')) BETWEEN ? AND ?
        OR DATE(STR_TO_DATE(wd.sentDate, '%Y-%m-%d')) BETWEEN ? AND ?
      )
      AND wd.status = 'approved'
    LEFT JOIN ot_records ot ON e.id = ot.employee_id 
      AND ot.attendance_date BETWEEN ? AND ? AND ot.approval_status = 'approved'
    LEFT JOIN billing_rates br ON (br.employee_id = e.id OR br.designation = e.designation)
      AND br.is_active = TRUE
    GROUP BY e.id
  `, [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate]);

  payrollData.forEach((row) => {
    const totalPay = parseFloat(row.total_pay || 0) + parseFloat(row.ot_pay || 0);
    iif += `TRNS\t${endDate}\tPayroll Expense\t${totalPay}\t${row.employeeName}\n`;
    iif += `SPL\t${endDate}\tCash\t-${totalPay}\t${row.employeeName}\n`;
    iif += "ENDTRNS\n";
  });

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Disposition", `attachment; filename=quickbooks_${startDate}_${endDate}.iif`);
  res.send(iif);
});

