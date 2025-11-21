import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const sendNotification = asyncHandler(async (req, res) => {
  const sql =
    "INSERT INTO notification (`from`,`to`,`message`, `sendDate`, `empId`, `tlId`) VALUES (?)";
  const values = [
    req.body.from,
    req.body.to,
    req.body.message,
    req.body.sendDate,
    req.body.empId,
    req.body.tlId,
  ];

  await query(sql, [values]);
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
  // Assuming notification table has 'to' field that can be userName or empId
  const sql = `
    SELECT * FROM notification 
    WHERE (empId = ? OR \`to\` = ? OR \`to\` = ?)
    ORDER BY sendDate DESC, id DESC
    LIMIT 100
  `;
  
  const results = await query(sql, [employeeId, userName, employeeId]);
  
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

