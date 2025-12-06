import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const sendNotification = asyncHandler(async (req, res) => {
  // Check if empId and tlId columns exist in the notification table
  // If they exist, include them; otherwise, use only the basic columns
  let sql;
  let values;
  
  try {
    // Try to insert with empId and tlId first
    sql = "INSERT INTO notification (`from`,`to`,`message`, `sendDate`, `empId`, `tlId`) VALUES (?, ?, ?, ?, ?, ?)";
    values = [
      req.body.from || '',
      req.body.to || '',
      req.body.message || '',
      req.body.sendDate || new Date().toISOString(),
      req.body.empId || '',
      req.body.tlId || '',
    ];
    await query(sql, values);
  } catch (error) {
    // If empId/tlId columns don't exist, use basic columns only
    if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage?.includes('empId')) {
      sql = "INSERT INTO notification (`from`,`to`,`message`, `sendDate`) VALUES (?, ?, ?, ?)";
      values = [
        req.body.from || '',
        req.body.to || '',
        req.body.message || '',
        req.body.sendDate || new Date().toISOString(),
      ];
      await query(sql, values);
    } else {
      throw error; // Re-throw if it's a different error
    }
  }
  
  return sendSuccess(res, null, "Notification sent successfully");
});

// Get Notifications for an employee
export const getNotifications = asyncHandler(async (req, res) => {
  const { employeeId } = req.query;
  
  if (!employeeId) {
    return sendError(res, "employeeId is required", 400);
  }
  
  // Get employee's userName from employeeId
  const employeeSql = "SELECT userName FROM employee WHERE EMPID = ? OR id = ? LIMIT 1";
  const employee = await query(employeeSql, [employeeId, employeeId]);
  
  if (employee.length === 0) {
    return sendError(res, "Employee not found", 404);
  }
  
  const userName = employee[0].userName;
  
  // Get notifications for this employee
  // Try to query with empId first, fallback to just 'to' field if empId doesn't exist
  let sql;
  let results;
  
  try {
    // Try query with empId column
    sql = `
      SELECT * FROM notification 
      WHERE (empId = ? OR \`to\` = ? OR \`to\` = ?)
      ORDER BY sendDate DESC, id DESC
      LIMIT 100
    `;
    results = await query(sql, [employeeId, userName, employeeId]);
  } catch (error) {
    // If empId column doesn't exist, use only 'to' field
    if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage?.includes('empId')) {
      sql = `
        SELECT * FROM notification 
        WHERE \`to\` = ? OR \`to\` = ?
        ORDER BY sendDate DESC, id DESC
        LIMIT 100
      `;
      results = await query(sql, [userName, employeeId]);
    } else {
      throw error; // Re-throw if it's a different error
    }
  }
  
  // Format results to include isRead flag (assuming there's a read status)
  const formattedResults = results.map(notification => ({
    ...notification,
    isRead: notification.isRead || notification.readStatus || 0,
    title: notification.message?.substring(0, 50) || 'Notification',
    message: notification.message || '',
    createdAt: notification.sendDate || notification.created_at,
  }));
  
  return sendSuccess(res, formattedResults);
});

