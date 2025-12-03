import { query, biometricQuery } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const createProject = asyncHandler(async (req, res) => {
  // Convert employeeIds array to JSON string for storage
  const assignedEmployeesJson = req.body.employeeIds && Array.isArray(req.body.employeeIds) 
    ? JSON.stringify(req.body.employeeIds) 
    : null;

  // Check if assignedEmployees column exists
  let includeAssignedEmployees = false;
  try {
    const columnCheckSql = `
      SELECT COUNT(*) as count 
      FROM information_schema.COLUMNS 
      WHERE table_schema = DATABASE() 
      AND table_name = 'project' 
      AND column_name = 'assignedEmployees'
    `;
    const columnCheck = await query(columnCheckSql);
    includeAssignedEmployees = columnCheck.length > 0 && columnCheck[0].count > 0;
  } catch (error) {
    console.warn("Could not check for assignedEmployees column:", error.message);
  }

  let sql, values;
  if (includeAssignedEmployees) {
    sql = "INSERT INTO project (`tlName`,`orderId`,`positionNumber`, `subPositionNumber`,`projectNo`,`taskJobNo`, `referenceNo`,`desciplineCode`, `projectName`,`subDivision`,`startDate`,`targetDate`,`allotatedHours`, `tlID`, `assignedEmployees`) VALUES (?)";
    values = [
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
      assignedEmployeesJson,
    ];
  } else {
    sql = "INSERT INTO project (`tlName`,`orderId`,`positionNumber`, `subPositionNumber`,`projectNo`,`taskJobNo`, `referenceNo`,`desciplineCode`, `projectName`,`subDivision`,`startDate`,`targetDate`,`allotatedHours`, `tlID`) VALUES (?)";
    values = [
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
  }

  const result = await query(sql, [values]);
  const projectId = result.insertId;

  return sendSuccess(res, { projectId }, "Project created successfully");
});

export const getProjects = asyncHandler(async (req, res) => {
  const sql = "SELECT * FROM project";
  const results = await query(sql);
  
  // Parse assignedEmployees from JSON string to array for each project
  const projects = results.map((project) => {
    if (project.assignedEmployees) {
      try {
        project.assignedEmployees = JSON.parse(project.assignedEmployees);
      } catch (error) {
        console.error("Error parsing assignedEmployees for project:", project.id, error.message);
        project.assignedEmployees = [];
      }
    } else {
      project.assignedEmployees = [];
    }
    return project;
  });
  
  return sendSuccess(res, projects);
});

export const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM project WHERE id = ?";
  const results = await query(sql, [id]);

  if (results.length === 0) {
    return sendError(res, "Project not found", 404);
  }

  const project = results[0];

  // Parse assignedEmployees from JSON string to array
  if (project.assignedEmployees) {
    try {
      project.assignedEmployees = JSON.parse(project.assignedEmployees);
    } catch (error) {
      // If parsing fails, set to empty array
      console.error("Error parsing assignedEmployees:", error.message);
      project.assignedEmployees = [];
    }
  } else {
    project.assignedEmployees = [];
  }

  return sendSuccess(res, project);
});

export const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  
  // Convert employeeIds array to JSON string for storage
  // Use employeeIds from request body if provided, otherwise use assignedEmployees
  const employeeIds = req.body.employeeIds || req.body.assignedEmployees;
  console.log(employeeIds, "employeeIds");
  const assignedEmployeesJson = employeeIds && Array.isArray(employeeIds) 
    ? JSON.stringify(employeeIds) 
    : (req.body.assignedEmployees ? JSON.stringify(req.body.assignedEmployees) : null);

  // Check if assignedEmployees column exists
  let includeAssignedEmployees = false;
  try {
    const columnCheckSql = `
      SELECT COUNT(*) as count 
      FROM information_schema.COLUMNS 
      WHERE table_schema = DATABASE() 
      AND table_name = 'project' 
      AND column_name = 'assignedEmployees'
    `;
    const columnCheck = await query(columnCheckSql);
    includeAssignedEmployees = columnCheck.length > 0 && columnCheck[0].count > 0;
    console.log("Column check result:", columnCheck, "includeAssignedEmployees:", includeAssignedEmployees);
  } catch (error) {
    console.warn("Could not check for assignedEmployees column:", error.message);
    // If check fails, try to use the column anyway (will fail gracefully if it doesn't exist)
    includeAssignedEmployees = true;
  }
  
  // If column doesn't exist but we have employeeIds, try to add it dynamically
  if (!includeAssignedEmployees && employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
    try {
      console.log("Attempting to add assignedEmployees column...");
      await query("ALTER TABLE project ADD COLUMN assignedEmployees TEXT NULL");
      includeAssignedEmployees = true;
      console.log("Successfully added assignedEmployees column");
    } catch (alterError) {
      // Column might already exist or there's a permission issue
      if (alterError.code === 'ER_DUP_FIELDNAME') {
        console.log("Column already exists, will use it");
        includeAssignedEmployees = true;
      } else {
        console.error("Could not add assignedEmployees column:", alterError.message);
      }
    }
  }
  
  console.log("Final includeAssignedEmployees:", includeAssignedEmployees);
  let sql, values;
  if (includeAssignedEmployees) {
    sql = `
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
        assignedEmployees = ?,
        tlID = ?
      WHERE id = ?
    `;
    values = [
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
      assignedEmployeesJson,
      req.body.tlID,
      projectId,
    ];
  } else {
    sql = `
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
    values = [
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
  }

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
  // Validate required fields
  if (!req.body.userName) {
    return sendError(res, "userName is required", 400);
  }
  
  // Get employeeName if not provided
  let employeeName = req.body.employeeName;
  if (!employeeName && req.body.userName) {
    try {
      const employeeSql = "SELECT employeeName FROM employee WHERE userName = ? LIMIT 1";
      const employee = await query(employeeSql, [req.body.userName]);
      if (employee.length > 0) {
        employeeName = employee[0].employeeName;
      }
    } catch (e) {
      // Continue without employeeName
    }
  }
  
  // employeeName is required, return error if still missing
  if (!employeeName) {
    return sendError(res, "employeeName is required. Please provide it in the request or ensure userName is valid.", 400);
  }
  
  const baseSql =
    "INSERT INTO workdetails (`employeeName`,`userName`,`referenceNo`,`projectName`,`tlName`, `taskNo`,`areaofWork`,`variation`, `subDivision`, `totalHours`, `weekNumber`,`projectNo`,`employeeNo`,`designation`";
  let sql = baseSql;
  const values = [
    employeeName, // Use the resolved employeeName
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
    "approverId",
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
  const { employeeId, startDate, endDate, tlId } = req.query;
  
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
  
  if (tlId) {
    // Filter by tlName matching tlId directly (tlName stores the ID)
    sql += " AND tlName = ?";
    params.push(tlId.toString());
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
  const { 
    employeeId, 
    employeeName, 
    projectName, 
    referenceNo, 
    areaOfWork,
    projectNo,
    taskNo,
    variation,
    subDivision,
    subDivisionList,
    allotatedHours,
    desciplineCode,
    date, 
    clockInTime 
  } = req.body;
  
  // Debug logging
  console.log('Clock In Request Body:', req.body);
  
  if (!employeeId || !employeeName) {
    return sendError(res, "employeeId and employeeName are required", 400);
  }
  
  // Get employee details to get userName, employeeNo, discipline, designation
  const employeeSql = "SELECT userName, EMPID, id, discipline, designation FROM employee WHERE EMPID = ? OR id = ? LIMIT 1";
  const employee = await query(employeeSql, [employeeId, employeeId]);
  
  if (employee.length === 0) {
    return sendError(res, "Employee not found", 404);
  }
  
  const userName = employee[0].userName;
  const employeeNo = employee[0].EMPID || employee[0].id;
  const employeeDiscipline = employee[0].discipline || '';
  const employeeDesignation = employee[0].designation || '';
  const currentDate = date || new Date().toISOString().split('T')[0];
  const currentDateTime = clockInTime || new Date().toISOString();
  
  // Calculate week number
  const clockInDate = new Date(currentDateTime);
  const startOfYear = new Date(clockInDate.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((clockInDate - startOfYear) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
  
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
  
  // Get project details if projectName or referenceNo is provided
  let projectData = {
    tlName: null,
    projectNo: null,
    taskNo: null,
    variation: null,
    subDivision: null,
    subDivisionList: null,
    allotatedHours: null,
  };
  
  if (projectName || referenceNo) {
    try {
      const projectSql = `
        SELECT tlName, projectNo, taskJobNo, variation, subDivision, allotatedHours 
        FROM project 
        WHERE projectName = ? OR referenceNo = ?
        LIMIT 1
      `;
      const projectResult = await query(projectSql, [projectName || '', referenceNo || '']);
      if (projectResult.length > 0) {
        const proj = projectResult[0];
        projectData.tlName = proj.tlName;
        projectData.projectNo = proj.projectNo;
        projectData.taskNo = proj.taskJobNo;
        projectData.variation = proj.variation;
        projectData.subDivision = proj.subDivision;
        projectData.subDivisionList = proj.subDivision;
        projectData.allotatedHours = proj.allotatedHours;
      }
    } catch (e) {
      console.log('Error fetching project:', e);
    }
  }
  
  // Get team lead ID if available - try multiple sources
  let tlNameId = null;
  
  // First, try to get from project
  if (projectData.tlName) {
    try {
      const tlSql = "SELECT id FROM team_lead WHERE leadName = ? LIMIT 1";
      const tlResult = await query(tlSql, [projectData.tlName]);
      if (tlResult.length > 0) {
        tlNameId = tlResult[0].id;
      }
    } catch (e) {
      // Continue to next method
    }
  }
  
  // If still no tlName, try to get from employee's team lead
  if (!tlNameId) {
    try {
      const teamLeadSql = `
        SELECT tl.id 
        FROM team_lead tl
        INNER JOIN employee e ON tl.EMPID = e.EMPID OR tl.EMPID = e.id
        WHERE e.EMPID = ? OR e.id = ?
        LIMIT 1
      `;
      const teamLeadResult = await query(teamLeadSql, [employeeId, employeeId]);
      if (teamLeadResult.length > 0) {
        tlNameId = teamLeadResult[0].id;
      }
    } catch (e) {
      // Use null as fallback
    }
  }
  
  // Use provided values or project values or defaults
  const finalProjectNo = projectNo || projectData.projectNo || '';
  const finalTaskNo = taskNo || projectData.taskNo || '';
  const finalVariation = variation || projectData.variation || '';
  const finalSubDivision = subDivision || projectData.subDivision || '';
  const finalSubDivisionList = subDivisionList || projectData.subDivisionList || '';
  const finalAllotatedHours = allotatedHours || projectData.allotatedHours || '';
  const finalDesciplineCode = desciplineCode || '';
  
  // Insert work detail record with clock in - include all fields like addWorkDetails
  const baseSql = `
    INSERT INTO workdetails (
      employeeName, userName, referenceNo, projectName, tlName, taskNo,
      areaofWork, variation, subDivision, totalHours, weekNumber,
      projectNo, employeeNo, designation, discipline, subDivisionList,
      status, sentDate, allotatedHours, desciplineCode
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  // Prepare values - match addWorkDetails structure
  // Convert numeric fields properly - use null for missing numbers, empty string for missing strings
  const values = [
    (employeeName && employeeName.trim()) || '', // employeeName
    (userName && userName.trim()) || '', // userName
    (referenceNo && referenceNo.trim()) || '', // referenceNo
    (projectName && projectName.trim()) || '', // projectName
    tlNameId ? parseInt(tlNameId) : null, // tlName (as ID number, not string) - can be null
    (finalTaskNo && finalTaskNo.toString().trim()) || '', // taskNo
    (areaOfWork && areaOfWork.trim()) || '', // areaofWork
    (finalVariation && finalVariation.trim()) || '', // variation
    (finalSubDivision && finalSubDivision.trim()) || '', // subDivision
    '0.0', // totalHours (will be updated on clock out)
    weekNumber.toString(), // weekNumber
    (finalProjectNo && finalProjectNo.toString().trim()) || '', // projectNo
    employeeNo ? parseInt(employeeNo) : null, // employeeNo (as number) - can be null
    (employeeDesignation && employeeDesignation.trim()) || '', // designation
    (employeeDiscipline && employeeDiscipline.trim()) || '', // discipline
    (finalSubDivisionList && finalSubDivisionList.trim()) || '', // subDivisionList
    'active', // status
    currentDateTime, // sentDate
    (finalAllotatedHours && finalAllotatedHours.toString().trim()) || '', // allotatedHours
    (finalDesciplineCode && finalDesciplineCode.trim()) || '', // desciplineCode
  ];
  
  // Debug logging to see what's being inserted
  console.log('Clock In - Inserting values:', {
    employeeName: values[0],
    userName: values[1],
    referenceNo: values[2],
    projectName: values[3],
    tlName: values[4],
    taskNo: values[5],
    areaofWork: values[6],
    variation: values[7],
    subDivision: values[8],
    totalHours: values[9],
    weekNumber: values[10],
    projectNo: values[11],
    employeeNo: values[12],
    designation: values[13],
    discipline: values[14],
    subDivisionList: values[15],
    status: values[16],
    sentDate: values[17],
    allotatedHours: values[18],
    desciplineCode: values[19],
  });
  
  console.log('Executing SQL:', baseSql);
  console.log('With values:', values);
  
  const result = await query(baseSql, values);
  
  console.log('Insert result:', result);
  console.log('Insert ID:', result.insertId);
  
  // Get the created record
  const getSql = "SELECT * FROM workdetails WHERE id = ?";
  const created = await query(getSql, [result.insertId]);
  
  console.log('Created record:', created[0]);
  
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
  
  // Determine which day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = clockOut.getDay();
  const dayFields = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayField = dayFields[dayOfWeek];
  
  // Get current week number
  const startOfYear = new Date(clockOut.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((clockOut - startOfYear) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
  
  // Update work detail - set status to completed, calculate hours, and update day field
  // Build dynamic SQL for day field update - use backticks for column names
  const dayFieldMap = {
    'sunday': 'sunday',
    'monday': 'monday',
    'tuesday': 'tuesday',
    'wednesday': 'wednesday',
    'thursday': 'thursday',
    'friday': 'friday',
    'saturday': 'saturday'
  };
  
  // Validate day field exists in map
  if (!dayFieldMap[dayField]) {
    return sendError(res, "Invalid day field", 400);
  }
  
  // Use backticks for column name to handle reserved words
  // Note: description column doesn't exist in workdetails table, so it's removed
  const sql = `
    UPDATE workdetails 
    SET totalHours = ?,
        status = 'completed',
        weekNumber = ?,
        \`${dayField}\` = ?
    WHERE id = ?
  `;
  
  await query(sql, [
    totalHours.toFixed(2),
    String(weekNumber),
    totalHours.toFixed(2),
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

