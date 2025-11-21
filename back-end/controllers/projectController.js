import { query, biometricQuery } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const createProject = asyncHandler(async (req, res) => {
  const sql =
    "INSERT INTO project (`tlName`,`orderId`,`positionNumber`, `subPositionNumber`,`projectNo`,`taskJobNo`, `referenceNo`,`desciplineCode`, `projectName`,`subDivision`,`startDate`,`targetDate`,`allotatedHours`, `tlID`) VALUES (?)";
  const values = [
    req.body.tlName,
    req.body.orderId,
    req.body.positionNumber,
    req.body.subPositionNumber,
    req.body.projectNo,
    req.body.taskJobNo,
    req.body.referenceNo,
    req.body.desciplineCode,
    req.body.projectName,
    req.body.subDivision,
    req.body.startDate,
    req.body.targetDate,
    req.body.allotatedHours,
    req.body.tlID,
  ];

  await query(sql, [values]);
  return sendSuccess(res, null, "Project created successfully");
});

export const getProjects = asyncHandler(async (req, res) => {
  const sql = "SELECT * FROM project";
  const results = await query(sql);
  return sendSuccess(res, results);
});

export const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM project WHERE id = ?";
  const results = await query(sql, [id]);

  if (results.length === 0) {
    return sendError(res, "Project not found", 404);
  }

  return sendSuccess(res, results[0]);
});

export const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const sql = `
    UPDATE project 
    SET 
      tlName = ?,
      orderId = ?,
      positionNumber = ?,
      subPositionNumber = ?,
      projectNo = ?,
      taskJobNo = ?,
      referenceNo = ?,
      desciplineCode = ?,
      projectName = ?,
      subDivision = ?,
      startDate = ?,
      targetDate = ?,
      allotatedHours = ?,
      tlID = ?
    WHERE id = ?
  `;
  const values = [
    req.body.tlName,
    req.body.orderId,
    req.body.positionNumber,
    req.body.subPositionNumber,
    req.body.projectNo,
    req.body.taskJobNo,
    req.body.referenceNo,
    req.body.desciplineCode,
    req.body.projectName,
    req.body.subDivision,
    req.body.startDate,
    req.body.targetDate,
    req.body.allotatedHours,
    req.body.tlID,
    projectId,
  ];

  await query(sql, values);
  return sendSuccess(res, null, "Project updated successfully");
});

export const updateProjectCompletion = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { completion } = req.body;

  const sql = "UPDATE project SET completion = ? WHERE id = ?";
  const values = [completion, projectId];

  const result = await query(sql, values);

  if (result.affectedRows === 0) {
    return sendError(res, "Project not found or no update required", 404);
  }

  return sendSuccess(res, null, "Project completion updated successfully");
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM project WHERE id = ?";
  await query(sql, [id]);
  return sendSuccess(res, null, "Project deleted successfully");
});

export const addWorkDetails = asyncHandler(async (req, res) => {
  const baseSql =
    "INSERT INTO workdetails (`employeeName`,`userName`,`referenceNo`,`projectName`,`tlName`, `taskNo`,`areaofWork`,`variation`, `subDivision`, `totalHours`, `weekNumber`,`projectNo`,`employeeNo`,`designation`";
  let sql = baseSql;
  const values = [
    req.body.employeeName,
    req.body.userName,
    req.body.referenceNo,
    req.body.projectName,
    req.body.tlName,
    req.body.taskNo,
    req.body.areaofWork,
    req.body.variation,
    req.body.subDivision,
    req.body.totalHours,
    req.body.weekNumber,
    req.body.projectNo,
    req.body.employeeNo,
    req.body.designation,
  ];

  const optionalFields = [
    "discipline",
    "subDivisionList",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "status",
    "sentDate",
    "approvedDate",
    "allotatedHours",
    "desciplineCode",
  ];

  optionalFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      sql += `, \`${field}\``;
      values.push(req.body[field]);
    }
  });
  sql += ") VALUES (?)";

  const result = await query(sql, [values]);
  return sendSuccess(res, result, "Work details added successfully");
});

export const updateWorkDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const baseSql =
    "UPDATE workdetails SET `employeeName`=?, `userName`=?, `referenceNo`=?, `projectName`=?, `tlName`=?, `taskNo`=?, `areaofWork`=?, `variation`=?, `subDivision`=?, `totalHours`=?, `weekNumber`=?, `projectNo`=?, `employeeNo`=?, `designation`=?";
  let sql = baseSql;
  const values = [
    req.body.employeeName,
    req.body.userName,
    req.body.referenceNo,
    req.body.projectName,
    req.body.tlName,
    req.body.taskNo,
    req.body.areaofWork,
    req.body.variation,
    req.body.subDivision,
    req.body.totalHours,
    req.body.weekNumber,
    req.body.projectNo,
    req.body.employeeNo,
    req.body.designation,
  ];

  const optionalFields = [
    "discipline",
    "subDivisionList",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "status",
    "sentDate",
    "approvedDate",
    "allotatedHours",
    "desciplineCode",
  ];

  optionalFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      sql += `, \`${field}\`=?`;
      values.push(req.body[field]);
    }
  });
  sql += " WHERE id = ?";
  values.push(id);

  await query(sql, values);
  return sendSuccess(res, null, "Work details updated successfully");
});

export const getWorkDetails = asyncHandler(async (req, res) => {
  const { employeeId, startDate, endDate } = req.query;
  
  let sql = "SELECT * FROM workdetails WHERE 1=1";
  const params = [];
  
  if (employeeId) {
    // Get userName from employeeId first
    const employeeSql = "SELECT userName FROM employee WHERE EMPID = ? OR id = ? LIMIT 1";
    const employee = await query(employeeSql, [employeeId, employeeId]);
    
    if (employee.length > 0) {
      sql += " AND userName = ?";
      params.push(employee[0].userName);
    } else {
      // If employee not found, return empty result
      return sendSuccess(res, []);
    }
  }
  
  if (startDate) {
    // Use sentDate field for date filtering
    sql += " AND (DATE(STR_TO_DATE(SUBSTRING(sentDate, 1, 10), '%Y-%m-%d')) >= ? OR DATE(STR_TO_DATE(sentDate, '%Y-%m-%d')) >= ?)";
    params.push(startDate, startDate);
  }
  
  if (endDate) {
    // Use sentDate field for date filtering
    sql += " AND (DATE(STR_TO_DATE(SUBSTRING(sentDate, 1, 10), '%Y-%m-%d')) <= ? OR DATE(STR_TO_DATE(sentDate, '%Y-%m-%d')) <= ?)";
    params.push(endDate, endDate);
  }
  
  sql += " ORDER BY sentDate DESC, id DESC";
  
  const results = await query(sql, params);
  return sendSuccess(res, results);
});

// Clock In - Create a new work detail record
export const clockIn = asyncHandler(async (req, res) => {
  const { employeeId, employeeName, projectName, referenceNo, areaOfWork, date, clockInTime } = req.body;
  
  if (!employeeId || !employeeName) {
    return sendError(res, "employeeId and employeeName are required", 400);
  }
  
  // Get employee details to get userName
  const employeeSql = "SELECT userName, EMPID FROM employee WHERE EMPID = ? OR id = ? LIMIT 1";
  const employee = await query(employeeSql, [employeeId, employeeId]);
  
  if (employee.length === 0) {
    return sendError(res, "Employee not found", 404);
  }
  
  const userName = employee[0].userName;
  const currentDate = date || new Date().toISOString().split('T')[0];
  const currentDateTime = clockInTime || new Date().toISOString();
  
  // Check if employee already clocked in today (no clock out)
  // Check for existing active clock-in using userName and sentDate
  const checkSql = `
    SELECT id FROM workdetails 
    WHERE userName = ? 
    AND (DATE(STR_TO_DATE(SUBSTRING(sentDate, 1, 10), '%Y-%m-%d')) = DATE(?)
         OR DATE(STR_TO_DATE(sentDate, '%Y-%m-%d')) = DATE(?))
    AND (status = 'active' OR status IS NULL OR status = '')
    LIMIT 1
  `;
  const existing = await query(checkSql, [userName, currentDate, currentDate]);
  
  if (existing.length > 0) {
    return sendError(res, "You are already clocked in. Please clock out first.", 400);
  }
  
  // Get team lead name if available (tlName is required field)
  // Try multiple sources: project, employee's team lead, or use empty string
  let tlName = '';
  
  // First, try to get from project if projectName or referenceNo is provided
  if (projectName || referenceNo) {
    try {
      const projectSql = `
        SELECT tlName FROM project 
        WHERE projectName = ? OR referenceNo = ?
        LIMIT 1
      `;
      const projectResult = await query(projectSql, [projectName || '', referenceNo || '']);
      if (projectResult.length > 0 && projectResult[0].tlName) {
        tlName = projectResult[0].tlName;
      }
    } catch (e) {
      // Continue to next method
    }
  }
  
  // If still no tlName, try to get from employee's team lead
  if (!tlName) {
    try {
      const teamLeadSql = `
        SELECT tl.leadName 
        FROM team_lead tl
        INNER JOIN employee e ON tl.EMPID = e.EMPID OR tl.EMPID = e.id
        WHERE e.EMPID = ? OR e.id = ?
        LIMIT 1
      `;
      const teamLeadResult = await query(teamLeadSql, [employeeId, employeeId]);
      if (teamLeadResult.length > 0 && teamLeadResult[0].leadName) {
        tlName = teamLeadResult[0].leadName;
      }
    } catch (e) {
      // Use empty string as fallback
    }
  }
  
  // If still no tlName, use empty string (required field but can be empty)
  if (!tlName) {
    tlName = '';
  }
  
  // Insert work detail record with clock in
  // workdetails table requires tlName, uses sentDate instead of date, and userName instead of employeeNo
  const sql = `
    INSERT INTO workdetails (
      employeeName, userName, tlName,
      projectName, referenceNo, areaofWork,
      sentDate, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `;
  
  const values = [
    employeeName,
    userName,
    tlName || '', // Required field, use empty string if not found
    projectName || null,
    referenceNo || null,
    areaOfWork || null,
    currentDateTime, // Use full datetime for sentDate
  ];
  
  const result = await query(sql, values);
  
  // Get the created record
  const getSql = "SELECT * FROM workdetails WHERE id = ?";
  const created = await query(getSql, [result.insertId]);
  
  return sendSuccess(res, created[0] || { id: result.insertId }, "Clocked in successfully");
});

// Clock Out - Update existing work detail record
export const clockOut = asyncHandler(async (req, res) => {
  const { employeeId, workDetailId, clockOutTime, description } = req.body;
  
  if (!employeeId || !workDetailId) {
    return sendError(res, "employeeId and workDetailId are required", 400);
  }
  
  // Get employee userName first
  const employeeSql = "SELECT userName FROM employee WHERE EMPID = ? OR id = ? LIMIT 1";
  const employee = await query(employeeSql, [employeeId, employeeId]);
  
  if (employee.length === 0) {
    return sendError(res, "Employee not found", 404);
  }
  
  const userName = employee[0].userName;
  
  // Check if work detail exists and belongs to employee
  const checkSql = `
    SELECT * FROM workdetails 
    WHERE id = ? 
    AND userName = ?
    AND (status = 'active' OR status IS NULL OR status = '')
  `;
  const workDetail = await query(checkSql, [workDetailId, userName]);
  
  if (workDetail.length === 0) {
    return sendError(res, "Work detail not found or already clocked out", 404);
  }
  
  // Calculate total hours
  // Use sentDate field (which contains the clock-in time) if clockInTime doesn't exist
  let clockInDate;
  if (workDetail[0].clockInTime) {
    clockInDate = new Date(workDetail[0].clockInTime);
  } else if (workDetail[0].sentDate) {
    // sentDate might be in various formats, try to parse it
    clockInDate = new Date(workDetail[0].sentDate);
  } else {
    // Fallback to current time if no date found
    clockInDate = new Date();
  }
  
  const clockOut = new Date(clockOutTime || new Date());
  const totalHours = Math.max(0, (clockOut - clockInDate) / (1000 * 60 * 60)); // Convert to hours
  
  // Update work detail - set status to completed and calculate hours
  const sql = `
    UPDATE workdetails 
    SET totalHours = ?,
        status = 'completed',
        description = ?
    WHERE id = ?
  `;
  
  await query(sql, [
    totalHours.toFixed(2),
    description || null,
    workDetailId
  ]);
  
  // Get updated record
  const getSql = "SELECT * FROM workdetails WHERE id = ?";
  const updated = await query(getSql, [workDetailId]);
  
  return sendSuccess(res, updated[0], "Clocked out successfully");
});

export const getBioDetails = asyncHandler(async (req, res) => {
  const sql = "SELECT * FROM devicelogsinfo";
  const results = await biometricQuery(sql);
  return sendSuccess(res, results);
});

export const filterTimeSheet = asyncHandler(async (req, res) => {
  const { userId, logDates } = req.body;

  if (!userId || !logDates || !Array.isArray(logDates) || logDates.length === 0) {
    return sendError(res, "userId and a non-empty array of logDates are required", 400);
  }

  // Use parameterized query to prevent SQL injection
  const placeholders = logDates.map(() => "?").join(",");
  const sql = `SELECT *, DATE_FORMAT(LogDate, '%Y-%m-%d %H:%i:%s') AS FormattedLogDate 
               FROM devicelogsinfo  
               WHERE DATE(LogDate) IN (${placeholders}) AND UserId = ?`;

  // Combine dates and userId for parameterized query
  const params = [...logDates, userId];

  const results = await biometricQuery(sql, params);
  return sendSuccess(res, results);
});

