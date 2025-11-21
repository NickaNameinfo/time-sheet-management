import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import nodemailer from "nodemailer";
import config from "../config/index.js";

// Create Email Transporter (configure in .env)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Get Report Schedules
export const getReportSchedules = asyncHandler(async (req, res) => {
  const { isActive } = req.query;
  let sql = "SELECT * FROM report_schedules WHERE 1=1";
  const params = [];

  if (isActive !== undefined) {
    sql += " AND is_active = ?";
    params.push(isActive === "true" ? 1 : 0);
  }

  sql += " ORDER BY report_name";

  const results = await query(sql, params);
  return sendSuccess(res, results);
});

// Create Report Schedule
export const createReportSchedule = asyncHandler(async (req, res) => {
  const { reportType, reportName, recipients, scheduleConfig } = req.body;

  if (!reportType || !reportName || !recipients || !scheduleConfig) {
    return sendError(res, "reportType, reportName, recipients, and scheduleConfig are required", 400);
  }

  // Calculate next send time
  const nextSendAt = calculateNextSendTime(scheduleConfig);

  const insertSql = `
    INSERT INTO report_schedules (report_type, report_name, recipients, schedule_config, next_send_at)
    VALUES (?, ?, ?, ?, ?)
  `;
  await query(insertSql, [
    reportType,
    reportName,
    JSON.stringify(recipients),
    JSON.stringify(scheduleConfig),
    nextSendAt,
  ]);

  return sendSuccess(res, null, "Report schedule created successfully");
});

// Calculate Next Send Time
const calculateNextSendTime = (scheduleConfig) => {
  const now = new Date();
  const { frequency, time, day } = scheduleConfig;

  if (frequency === "daily") {
    const [hours, minutes] = time.split(":");
    const next = new Date(now);
    next.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next.toISOString();
  } else if (frequency === "weekly") {
    const [hours, minutes] = time.split(":");
    const dayMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
    const targetDay = dayMap[day.toLowerCase()] || 1;
    const next = new Date(now);
    next.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const currentDay = next.getDay();
    const daysUntilTarget = (targetDay - currentDay + 7) % 7;
    if (daysUntilTarget === 0 && next <= now) {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + daysUntilTarget);
    }
    return next.toISOString();
  } else if (frequency === "monthly") {
    const [hours, minutes] = time.split(":");
    const dayOfMonth = parseInt(day) || 1;
    const next = new Date(now);
    next.setDate(dayOfMonth);
    next.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
    return next.toISOString();
  }

  return now.toISOString();
};

// Generate and Send Report
export const generateAndSendReport = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;

  const scheduleSql = "SELECT * FROM report_schedules WHERE id = ?";
  const schedules = await query(scheduleSql, [scheduleId]);

  if (schedules.length === 0) {
    return sendError(res, "Report schedule not found", 404);
  }

  const schedule = schedules[0];
  const recipients = JSON.parse(schedule.recipients);
  const scheduleConfig = JSON.parse(schedule.schedule_config);

  // Generate report data based on report type
  let reportData = {};
  const endDate = new Date().toISOString().split("T")[0];
  let startDate = new Date();
  
  if (schedule.report_type === "daily") {
    startDate.setDate(startDate.getDate() - 1);
  } else if (schedule.report_type === "weekly") {
    startDate.setDate(startDate.getDate() - 7);
  } else if (schedule.report_type === "monthly") {
    startDate.setMonth(startDate.getMonth() - 1);
  }
  startDate = startDate.toISOString().split("T")[0];

  // Get report data (simplified - you can expand based on report type)
  const workDetailsSql = `
    SELECT COUNT(*) as total_entries, SUM(totalHours) as total_hours
    FROM workdetails
    WHERE DATE(sentDate) BETWEEN ? AND ?
    AND status = 'approved'
  `;
  const workData = await query(workDetailsSql, [startDate, endDate]);

  reportData = {
    period: { startDate, endDate },
    totalEntries: workData[0].total_entries,
    totalHours: parseFloat(workData[0].total_hours || 0),
    reportType: schedule.report_type,
  };

  // Send email
  try {
    const transporter = createTransporter();
    const emailHtml = generateReportEmail(reportData, schedule.report_name);

    for (const recipient of recipients) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipient.email,
        subject: `${schedule.report_name} - ${startDate} to ${endDate}`,
        html: emailHtml,
      });
    }

    // Update last sent time and calculate next
    const nextSendAt = calculateNextSendTime(scheduleConfig);
    await query(
      "UPDATE report_schedules SET last_sent_at = NOW(), next_send_at = ? WHERE id = ?",
      [nextSendAt, scheduleId]
    );

    return sendSuccess(res, { sentTo: recipients.length }, "Report sent successfully");
  } catch (error) {
    console.error("Email error:", error);
    return sendError(res, `Failed to send report: ${error.message}`, 500);
  }
});

// Generate Report Email HTML
const generateReportEmail = (data, reportName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .summary { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${reportName}</h1>
      </div>
      <div class="content">
        <h2>Report Summary</h2>
        <div class="summary">
          <p><strong>Period:</strong> ${data.period.startDate} to ${data.period.endDate}</p>
          <p><strong>Total Entries:</strong> ${data.totalEntries}</p>
          <p><strong>Total Hours:</strong> ${data.totalHours.toFixed(2)}</p>
        </div>
        <p>This is an automated report. Please contact support if you have any questions.</p>
      </div>
      <div class="footer">
        <p>Time Sheet Management System</p>
        <p>This is an automated email. Please do not reply.</p>
      </div>
    </body>
    </html>
  `;
};

// Manual Report Generation
export const generateReport = asyncHandler(async (req, res) => {
  const { reportType, startDate, endDate, format } = req.query;

  if (!reportType || !startDate || !endDate) {
    return sendError(res, "reportType, startDate, and endDate are required", 400);
  }

  // Generate report based on type
  let reportData = {};

  switch (reportType) {
    case "daily":
    case "weekly":
    case "monthly":
      const workSql = `
        SELECT 
          DATE(sentDate) as date,
          COUNT(*) as entries,
          SUM(totalHours) as hours
        FROM workdetails
        WHERE DATE(sentDate) BETWEEN ? AND ?
        AND status = 'approved'
        GROUP BY DATE(sentDate)
        ORDER BY date
      `;
      const workData = await query(workSql, [startDate, endDate]);
      reportData = { type: reportType, period: { startDate, endDate }, data: workData };
      break;

    default:
      return sendError(res, "Invalid report type", 400);
  }

  if (format === "email") {
    // Send via email
    const { recipients } = req.body;
    if (!recipients || !Array.isArray(recipients)) {
      return sendError(res, "recipients array is required", 400);
    }

    try {
      const transporter = createTransporter();
      const emailHtml = generateReportEmail(reportData, `${reportType} Report`);

      for (const recipient of recipients) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: recipient,
          subject: `${reportType} Report - ${startDate} to ${endDate}`,
          html: emailHtml,
        });
      }

      return sendSuccess(res, { sentTo: recipients.length }, "Report sent successfully");
    } catch (error) {
      return sendError(res, `Failed to send report: ${error.message}`, 500);
    }
  }

  return sendSuccess(res, reportData);
});

// Update Report Schedule
export const updateReportSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const fields = [];
  const values = [];

  if (updateData.recipients) {
    fields.push("recipients = ?");
    values.push(JSON.stringify(updateData.recipients));
  }
  if (updateData.scheduleConfig) {
    fields.push("schedule_config = ?");
    values.push(JSON.stringify(updateData.scheduleConfig));
    // Recalculate next send time
    const nextSendAt = calculateNextSendTime(updateData.scheduleConfig);
    fields.push("next_send_at = ?");
    values.push(nextSendAt);
  }
  if (updateData.isActive !== undefined) {
    fields.push("is_active = ?");
    values.push(updateData.isActive ? 1 : 0);
  }

  if (fields.length === 0) {
    return sendError(res, "No fields to update", 400);
  }

  values.push(id);
  const sql = `UPDATE report_schedules SET ${fields.join(", ")} WHERE id = ?`;
  await query(sql, values);

  return sendSuccess(res, null, "Report schedule updated successfully");
});

// Delete Report Schedule
export const deleteReportSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await query("DELETE FROM report_schedules WHERE id = ?", [id]);
  return sendSuccess(res, null, "Report schedule deleted successfully");
});

