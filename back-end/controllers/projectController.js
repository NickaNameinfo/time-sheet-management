import { getTenantQuery, biometricQuery } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const createProject = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
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
    const columnCheck = await q(columnCheckSql);
    includeAssignedEmployees = columnCheck.length > 0 && columnCheck[0].count > 0;
  } catch (error) {
    console.warn("Could not check for assignedEmployees column:", error.message);
  }

  // Check if status column exists
  let includeStatus = false;
  try {
    const columnCheckSql = `
      SELECT COUNT(*) as count 
      FROM information_schema.COLUMNS 
      WHERE table_schema = DATABASE() 
      AND table_name = 'project' 
      AND column_name = 'status'
    `;
    const columnCheck = await q(columnCheckSql);
    includeStatus = columnCheck.length > 0 && columnCheck[0].count > 0;
  } catch (error) {
    console.warn("Could not check for status column:", error.message);
  }

  // Check if description column exists
  let includeDescription = false;
  try {
    const columnCheckSql = `
      SELECT COUNT(*) as count 
      FROM information_schema.COLUMNS 
      WHERE table_schema = DATABASE() 
      AND table_name = 'project' 
      AND column_name = 'description'
    `;
    const columnCheck = await q(columnCheckSql);
    includeDescription = columnCheck.length > 0 && columnCheck[0].count > 0;
  } catch (error) {
    console.warn("Could not check for description column:", error.message);
  }

  // Check if removed columns still exist and need NULL values
  const checkColumnExists = async (columnName) => {
    try {
      const columnCheckSql = `
        SELECT COUNT(*) as count 
        FROM information_schema.COLUMNS 
        WHERE table_schema = DATABASE() 
        AND table_name = 'project' 
        AND column_name = ?
      `;
      const columnCheck = await q(columnCheckSql, [columnName]);
      return columnCheck.length > 0 && columnCheck[0].count > 0;
    } catch (error) {
      return false;
    }
  };

  const removedColumns = ['orderId', 'positionNumber', 'subPositionNumber', 'taskJobNo', 'referenceNo'];
  const columnsToInclude = [];
  const valuesToInclude = [];

  // Check each removed column and include with NULL if it exists
  for (const col of removedColumns) {
    const exists = await checkColumnExists(col);
    if (exists) {
      columnsToInclude.push(col);
      valuesToInclude.push(null);
    }
  }

  // Build SQL dynamically based on available columns
  let columns = ['tlName', 'projectNo', 'desciplineCode', 'projectName', 'subDivision'];
  let values = [
    req.body.tlName,
    req.body.projectNo,
    req.body.desciplineCode,
    req.body.projectName,
    req.body.subDivision,
  ];

  // Add removed columns with NULL values if they exist
  if (columnsToInclude.length > 0) {
    columns = [...columnsToInclude, ...columns];
    values = [...valuesToInclude, ...values];
  }

  if (includeDescription) {
    columns.push('description');
    values.push(req.body.description || null);
  }

  columns.push('startDate', 'targetDate', 'allotatedHours');
  values.push(req.body.startDate, req.body.targetDate, req.body.allotatedHours);

  if (includeStatus) {
    columns.push('status');
    values.push(req.body.status || 'active');
  }

  columns.push('tlID');
  values.push(req.body.tlID);

  if (includeAssignedEmployees) {
    columns.push('assignedEmployees');
    values.push(assignedEmployeesJson);
  }

  const sql = `INSERT INTO project (\`${columns.join('`, `')}\`) VALUES (?)`;

  const result = await q(sql, [values]);
  const projectId = result.insertId;

  return sendSuccess(res, { projectId }, "Project created successfully");
});

export const getProjects = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const sql = "SELECT * FROM project";
  const results = await q(sql);
  
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
  const q = getTenantQuery(req);
  const { id } = req.params;
  const sql = "SELECT * FROM project WHERE id = ?";
  const results = await q(sql, [id]);

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
  const q = getTenantQuery(req);
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
    const columnCheck = await q(columnCheckSql);
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
      await q("ALTER TABLE project ADD COLUMN assignedEmployees TEXT NULL");
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
  
  // Check if status column exists
  let includeStatus = false;
  try {
    const columnCheckSql = `
      SELECT COUNT(*) as count 
      FROM information_schema.COLUMNS 
      WHERE table_schema = DATABASE() 
      AND table_name = 'project' 
      AND column_name = 'status'
    `;
    const columnCheck = await q(columnCheckSql);
    includeStatus = columnCheck.length > 0 && columnCheck[0].count > 0;
  } catch (error) {
    console.warn("Could not check for status column:", error.message);
  }

  // Check if description column exists
  let includeDescription = false;
  try {
    const columnCheckSql = `
      SELECT COUNT(*) as count 
      FROM information_schema.COLUMNS 
      WHERE table_schema = DATABASE() 
      AND table_name = 'project' 
      AND column_name = 'description'
    `;
    const columnCheck = await q(columnCheckSql);
    includeDescription = columnCheck.length > 0 && columnCheck[0].count > 0;
  } catch (error) {
    console.warn("Could not check for description column:", error.message);
  }

  // Check if removed columns still exist and need NULL values
  const checkColumnExists = async (columnName) => {
    try {
      const columnCheckSql = `
        SELECT COUNT(*) as count 
        FROM information_schema.COLUMNS 
        WHERE table_schema = DATABASE() 
        AND table_name = 'project' 
        AND column_name = ?
      `;
      const columnCheck = await q(columnCheckSql, [columnName]);
      return columnCheck.length > 0 && columnCheck[0].count > 0;
    } catch (error) {
      return false;
    }
  };

  const removedColumns = ['orderId', 'positionNumber', 'subPositionNumber', 'taskJobNo', 'referenceNo'];
  const updateFieldsToInclude = [];
  const valuesToInclude = [];

  // Check each removed column and include with NULL if it exists
  for (const col of removedColumns) {
    const exists = await checkColumnExists(col);
    if (exists) {
      updateFieldsToInclude.push(`${col} = ?`);
      valuesToInclude.push(null);
    }
  }

  // Build SQL dynamically based on available columns
  let updateFields = [
    'tlName = ?',
    'projectNo = ?',
    'desciplineCode = ?',
    'projectName = ?',
    'subDivision = ?',
  ];
  let values = [
    req.body.tlName,
    req.body.projectNo,
    req.body.desciplineCode,
    req.body.projectName,
    req.body.subDivision,
  ];

  // Add removed columns with NULL values if they exist
  if (updateFieldsToInclude.length > 0) {
    updateFields = [...updateFieldsToInclude, ...updateFields];
    values = [...valuesToInclude, ...values];
  }

  if (includeDescription) {
    updateFields.push('description = ?');
    values.push(req.body.description || null);
  }

  updateFields.push('startDate = ?', 'targetDate = ?', 'allotatedHours = ?');
  values.push(req.body.startDate, req.body.targetDate, req.body.allotatedHours);

  if (includeStatus) {
    updateFields.push('status = ?');
    values.push(req.body.status || 'active');
  }

  if (includeAssignedEmployees) {
    updateFields.push('assignedEmployees = ?');
    values.push(assignedEmployeesJson);
  }

  updateFields.push('tlID = ?');
  values.push(req.body.tlID);
  values.push(projectId);

  const sql = `UPDATE project SET ${updateFields.join(', ')} WHERE id = ?`;

  await q(sql, values);
  return sendSuccess(res, null, "Project updated successfully");
});

export const updateProjectCompletion = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { projectId } = req.params;
  const { completion } = req.body;

  const sql = "UPDATE project SET completion = ? WHERE id = ?";
  const values = [completion, projectId];

  const result = await q(sql, values);

  if (result.affectedRows === 0) {
    return sendError(res, "Project not found or no update required", 404);
  }

  return sendSuccess(res, null, "Project completion updated successfully");
});

export const deleteProject = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const sql = "DELETE FROM project WHERE id = ?";
  await q(sql, [id]);
  return sendSuccess(res, null, "Project deleted successfully");
});

export const addWorkDetails = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  // Validate required fields
  if (!req.body.userName) {
    return sendError(res, "userName is required", 400);
  }
  
  // Get employeeName if not provided
  let employeeName = req.body.employeeName;
  if (!employeeName && req.body.userName) {
    try {
      const employeeSql = "SELECT employeeName FROM employee WHERE userName = ? LIMIT 1";
      const employee = await q(employeeSql, [req.body.userName]);
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

  const result = await q(sql, [values]);
  return sendSuccess(res, result, "Work details added successfully");
});

export const updateWorkDetails = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;

  // 1. Define all possible columns in your database that are allowed to be updated
  // Note: Make sure these match your DB column names exactly (e.g., 'areaofWork')
  const allowedFields = [
    "employeeName", "userName", "referenceNo", "projectName", "tlName", 
    "taskNo", "areaofWork", "variation", "subDivision", "totalHours", 
    "weekNumber", "projectNo", "employeeNo", "designation", "discipline", 
    "subDivisionList", "monday", "tuesday", "wednesday", "thursday", 
    "friday", "saturday", "sunday", "status", "sentDate", 
    "approvedDate", "allotatedHours", "desciplineCode", "approverId"
  ];

  // 2. Dynamically build the SET clause
  const updates = [];
  const values = [];

  // Iterate over the keys provided in req.body
  Object.keys(req.body).forEach((key) => {
    // Check if the key is in our allowed list AND is not undefined
    if (allowedFields.includes(key) && req.body[key] !== undefined) {
      updates.push(`\`${key}\` = ?`); // Add field to SQL (e.g., `userName` = ?)
      values.push(req.body[key]);     // Add value to array
    }
  });

  // 3. Validation: If no valid fields were sent, stop here
  if (updates.length === 0) {
    return sendError(res, "No valid fields provided for update", 400);
  }

  // 4. Construct Final SQL
  // Join the updates array with commas
  const sql = `UPDATE workdetails SET ${updates.join(", ")} WHERE id = ?`;
  
  // Add the ID to the end of the values array for the WHERE clause
  values.push(id);

  console.log("Update SQL:", sql); // Debugging: check the query
  console.log("Update Values:", values);

  // 5. Execute
  await q(sql, values);
  return sendSuccess(res, null, "Work details updated successfully");
});

export const getWorkDetails = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { employeeId, startDate, endDate, tlId } = req.query;
  
  let sql = "SELECT * FROM workdetails WHERE 1=1";
  const params = [];
  
  if (employeeId) {
    // Get userName from employeeId first
    const employeeSql = "SELECT userName FROM employee WHERE EMPID = ? OR id = ? LIMIT 1";
    const employee = await q(employeeSql, [employeeId, employeeId]);
    
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
  
  const results = await q(sql, params);
  return sendSuccess(res, results);
});

// Clock In - Create a new work detail record
export const clockIn = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { 
    employeeId, 
    employeeName, 
    employeeNo: reqEmployeeNo,
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
    designation: reqDesignation,
    tlName: reqTlName, // Can be ID or Name
    date, 
    clockInTime 
  } = req.body;

  // 1. Validation
  if (!employeeId) {
    return sendError(res, "employeeId is required", 400);
  }

  // 2. Fetch Employee Details
  const employeeSql = `
    SELECT userName, employeeName, EMPID, id, discipline, designation 
    FROM employee 
    WHERE EMPID = ? OR id = ? 
    LIMIT 1
  `;
  const employeeResult = await q(employeeSql, [employeeId, employeeId]);
  
  if (employeeResult.length === 0) {
    return sendError(res, "Employee not found", 404);
  }

  const empData = employeeResult[0];
  
  // Validate critical employee data
  if (!empData.userName || (!empData.employeeName && !employeeName)) {
    return sendError(res, "Critical employee data (username/name) missing. Contact administrator.", 404);
  }

  // 3. Prepare Employee Variables (DB takes precedence, fallback to Request)
  const finalEmployeeName = (empData.employeeName && empData.employeeName.trim()) || employeeName;
  const finalUserName = empData.userName;
  const finalEmployeeNo = reqEmployeeNo ? parseInt(reqEmployeeNo) : (empData.EMPID || empData.id);
  const finalDesignation = reqDesignation || empData.designation || '';
  const finalDiscipline = empData.discipline || '';

  // 4. Time and Date Calculation
  // clockInTime from mobile app is in UTC (ISO format with 'Z')
  // Store as UTC in database for global consistency
  const currentDateTime = clockInTime || new Date().toISOString();
  // Ensure we compare DATE only parts for the "already clocked in" check
  const checkDate = date || new Date().toISOString().split('T')[0];

  // Calculate Week Number - Match frontend calculation
  // Frontend uses: Math.floor(diff / oneWeekInMilliseconds) + 1
  const clockInDateObj = new Date(currentDateTime);
  const startOfYear = new Date(clockInDateObj.getFullYear(), 0, 1);
  const diff = clockInDateObj.getTime() - startOfYear.getTime();
  const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
  const weekNumber = Math.floor(diff / oneWeekInMilliseconds) + 1;

  // 5. Check for Existing Active Clock-In
  // We check if there is a record with status='active' for this user today
  const checkSql = `
    SELECT id FROM workdetails 
    WHERE userName = ? 
    AND (status = 'active' OR status IS NULL OR status = '')
    AND DATE(sentDate) = DATE(?)
    LIMIT 1
  `;
  
  const existing = await q(checkSql, [finalUserName, currentDateTime]); // Using currentDateTime ensures DB formats match
  
  if (existing.length > 0) {
    return sendError(res, "You are already clocked in for today. Please clock out first.", 400);
  }

  // 6. Fetch Project Defaults (if Project Name/Ref provided)
  let projDefaults = {};
  
  if (projectName || referenceNo) {
    try {
      const projectSql = `
        SELECT tlName, projectNo, taskJobNo, subDivision, allotatedHours 
        FROM project 
        WHERE projectName = ? OR referenceNo = ?
        LIMIT 1
      `;
      const projResult = await q(projectSql, [projectName || '', referenceNo || '']);
      
      if (projResult.length > 0) {
        projDefaults = projResult[0];
      }
    } catch (e) {
      console.error('Error fetching project details:', e);
    }
  }

  // 7. Resolve Team Lead ID (The Hierarchy: Req Body -> Project -> Employee's Manager)
  let finalTlId = null;

  // A. Check Request Body first
  if (reqTlName) {
    if (!isNaN(parseInt(reqTlName))) {
      // It's already an ID
      finalTlId = parseInt(reqTlName);
    } else {
      // It's a name, look up the ID
      const tlSql = "SELECT id FROM team_lead WHERE leadName = ? LIMIT 1";
      const tlRes = await q(tlSql, [reqTlName]);
      if (tlRes.length > 0) finalTlId = tlRes[0].id;
    }
  }

  // B. Check Project Default if still null
  if (!finalTlId && projDefaults.tlName) {
    // Usually project table stores the TL Name, so we look up the ID
    const tlSql = "SELECT id FROM team_lead WHERE leadName = ? LIMIT 1";
    const tlRes = await q(tlSql, [projDefaults.tlName]);
    if (tlRes.length > 0) finalTlId = tlRes[0].id;
  }

  // C. Check Employee's Assigned Team Lead if still null
  if (!finalTlId) {
    try {
      const teamLeadSql = `
        SELECT tl.id 
        FROM team_lead tl
        JOIN employee e ON (tl.EMPID = e.EMPID OR tl.EMPID = e.id)
        WHERE e.EMPID = ? OR e.id = ?
        LIMIT 1
      `;
      const tlRes = await q(teamLeadSql, [employeeId, employeeId]);
      if (tlRes.length > 0) finalTlId = tlRes[0].id;
    } catch (e) { console.error('Error fetching default team lead:', e); }
  }

  // 8. Prepare Final Values for Insert
  // Priority: Request > Project Default > Empty String
  const getVal = (reqVal, projVal) => {
    if (reqVal !== undefined && reqVal !== null) return reqVal.toString().trim();
    if (projVal !== undefined && projVal !== null) return projVal.toString().trim();
    return '';
  };

  const dbValues = {
    employeeName: finalEmployeeName,
    userName: finalUserName,
    referenceNo: referenceNo || '',
    projectName: projectName || '',
    tlName: finalTlId, // This column seems to store the ID based on your logic
    taskNo: getVal(taskNo, projDefaults.taskJobNo),
    areaofWork: areaOfWork || '',
    variation: getVal(variation, null), // Variation not in project table
    subDivision: getVal(subDivision, projDefaults.subDivision),
    totalHours: '0.0',
    weekNumber: weekNumber.toString(),
    projectNo: getVal(projectNo, projDefaults.projectNo),
    employeeNo: finalEmployeeNo,
    designation: finalDesignation,
    discipline: finalDiscipline,
    subDivisionList: getVal(subDivisionList, projDefaults.subDivision),
    status: 'active',
    sentDate: currentDateTime,
    allotatedHours: getVal(allotatedHours, projDefaults.allotatedHours),
    desciplineCode: desciplineCode || ''
  };

  // 9. Execute Insert
  // Convert currentDateTime (ISO string in UTC) to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
  // This stores UTC time in database (e.g., 08:59:36 UTC = 14:29 local time for UTC+5:30)
  const clockInTimeStr = currentDateTime.replace('T', ' ').substring(0, 19);
  
  const insertSql = `
    INSERT INTO workdetails (
      employeeName, userName, referenceNo, projectName, tlName, taskNo,
      areaofWork, variation, subDivision, totalHours, weekNumber,
      projectNo, employeeNo, designation, discipline, subDivisionList,
      status, sentDate, allotatedHours, desciplineCode, clockInTime
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const insertParams = [
    dbValues.employeeName,
    dbValues.userName,
    dbValues.referenceNo,
    dbValues.projectName,
    dbValues.tlName,
    dbValues.taskNo,
    dbValues.areaofWork,
    dbValues.variation,
    dbValues.subDivision,
    dbValues.totalHours,
    dbValues.weekNumber,
    dbValues.projectNo,
    dbValues.employeeNo,
    dbValues.designation,
    dbValues.discipline,
    dbValues.subDivisionList,
    dbValues.status,
    dbValues.sentDate,
    dbValues.allotatedHours,
    dbValues.desciplineCode,
    clockInTimeStr // Store clock-in datetime
  ];

  console.log('Clock In - Inserting for:', finalUserName);

  const result = await q(insertSql, insertParams);

  // 10. Return Result
  // Fetch the created record to return to frontend
  const getCreatedSql = "SELECT * FROM workdetails WHERE id = ?";
  const createdRecord = await q(getCreatedSql, [result.insertId]);

  return sendSuccess(res, createdRecord[0] || { id: result.insertId }, "Clocked in successfully");
});

// Clock Out - Update existing work detail record
export const clockOut = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { employeeId, workDetailId, clockOutTime, description } = req.body;
  
  if (!employeeId || !workDetailId) {
    return sendError(res, "employeeId and workDetailId are required", 400);
  }
  
  // Get employee userName first
  const employeeSql = "SELECT userName FROM employee WHERE EMPID = ? OR id = ? LIMIT 1";
  const employee = await q(employeeSql, [employeeId, employeeId]);
  
  if (employee.length === 0) {
    return sendError(res, "Employee not found", 404);
  }
  
  const userName = employee[0].userName;
  
  // Check if work detail exists and belongs to employee
  // Use DATE_FORMAT to get raw string values for clockInTime and clockOutTime
  const checkSql = `
    SELECT *,
           DATE_FORMAT(clockInTime, '%Y-%m-%d %H:%i:%s') as clockInTimeRaw,
           DATE_FORMAT(clockOutTime, '%Y-%m-%d %H:%i:%s') as clockOutTimeRaw
    FROM workdetails 
    WHERE id = ? 
    AND userName = ?
    AND (status = 'active' OR status IS NULL OR status = '')
  `;
  const workDetail = await q(checkSql, [workDetailId, userName]);
  
  if (workDetail.length === 0) {
    return sendError(res, "Work detail not found or already clocked out", 404);
  }
  
  // Calculate total hours
  // Helper function to parse date consistently (handles various formats from MySQL)
  const parseDate = (dateValue) => {
    if (!dateValue) return null;
    
    // Convert to string if it's not already
    const dateStr = dateValue.toString().trim();
    
    // If it's already an ISO string with timezone info, parse directly
    if (dateStr.includes('T') && (dateStr.includes('Z') || dateStr.includes('+') || dateStr.includes('-'))) {
      return new Date(dateStr);
    }
    
    // If it's a MySQL DATETIME format (YYYY-MM-DD HH:MM:SS), parse it
    // CRITICAL: MySQL DATETIME is stored as UTC in our system, so treat it as UTC
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateStr)) {
      // MySQL DATETIME format - explicitly parse as UTC
      // Split into date and time parts
      const [datePart, timePart] = dateStr.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute, second] = timePart.split(':').map(Number);
      
      // Create UTC date explicitly
      return new Date(Date.UTC(year, month - 1, day, hour, minute, second || 0));
    }
    
    // Try parsing as-is
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    
    return null;
  };
  
  // CRITICAL: Use raw clockInTime and clockOutTime values directly for calculation
  // Get raw string values from database to avoid timezone conversion issues
  // Prefer clockInTimeRaw (formatted string) over clockInTime (Date object)
  const rawClockInTime = workDetail[0].clockInTimeRaw || workDetail[0].clockInTime;
  const rawClockOutTime = clockOutTime; // From request (ISO string)
  
  // Convert raw values to strings for consistent parsing
  let clockInTimeStr = rawClockInTime;
  let clockOutTimeStr = rawClockOutTime;
  
  // Handle different data types from database
  if (rawClockInTime instanceof Date) {
    // If MySQL returned it as Date object, convert to ISO string
    clockInTimeStr = rawClockInTime.toISOString();
  } else if (typeof rawClockInTime === 'string') {
    // If it's already a string, use as-is
    clockInTimeStr = rawClockInTime;
  } else {
    // Fallback to sentDate if clockInTime is not available
    if (workDetail[0].sentDate) {
      clockInTimeStr = workDetail[0].sentDate instanceof Date 
        ? workDetail[0].sentDate.toISOString()
        : workDetail[0].sentDate.toString();
    } else {
      return sendError(res, "Clock-in time not found in database", 400);
    }
  }
  
  // Ensure clockOutTime is a string
  if (typeof clockOutTimeStr !== 'string') {
    clockOutTimeStr = clockOutTimeStr.toString();
  }
  
  // Parse both times as UTC ISO strings for accurate calculation
  // Both should be in ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)
  let clockInDate, clockOutDate;
  
  // Parse clockInTime - handle MySQL DATETIME format if needed
  if (clockInTimeStr.includes('T') && (clockInTimeStr.includes('Z') || clockInTimeStr.includes('+') || clockInTimeStr.includes('-'))) {
    // Already in ISO format
    clockInDate = new Date(clockInTimeStr);
  } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(clockInTimeStr)) {
    // MySQL DATETIME format - parse as UTC explicitly
    const [datePart, timePart] = clockInTimeStr.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    clockInDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second || 0));
  } else {
    clockInDate = new Date(clockInTimeStr);
  }
  
  // Parse clockOutTime - should be ISO string from request
  clockOutDate = new Date(clockOutTimeStr);
  
  // Validate both dates
  if (isNaN(clockInDate.getTime())) {
    return sendError(res, "Invalid clock-in time format", 400);
  }
  if (isNaN(clockOutDate.getTime())) {
    return sendError(res, "Invalid clock-out time format", 400);
  }
  
  // Calculate difference using raw timestamps (both in UTC milliseconds)
  const clockInTimestamp = clockInDate.getTime();
  const clockOutTimestamp = clockOutDate.getTime();
  const diffMs = clockOutTimestamp - clockInTimestamp;
  
  // Safety check: if negative or invalid, return error
  if (diffMs < 0) {
    console.error('Invalid time calculation: clock-out is before clock-in', {
      rawClockInTime: rawClockInTime,
      rawClockOutTime: rawClockOutTime,
      clockInTimeStr: clockInTimeStr,
      clockOutTimeStr: clockOutTimeStr,
      clockInTimestamp: clockInTimestamp,
      clockOutTimestamp: clockOutTimestamp,
      diffMs: diffMs
    });
    return sendError(res, "Clock-out time cannot be before clock-in time", 400);
  }
  
  // Calculate total seconds and hours from raw datetime difference
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalHours = totalSeconds / 3600.0;
  
  // Log calculation using raw values
  console.log('=== Hours Calculation (Using Raw Values) ===');
  console.log('Raw clockInTime from DB:', rawClockInTime, 'Type:', typeof rawClockInTime);
  console.log('Raw clockOutTime from Request:', rawClockOutTime, 'Type:', typeof rawClockOutTime);
  console.log('clockInTimeStr (parsed):', clockInTimeStr);
  console.log('clockOutTimeStr (parsed):', clockOutTimeStr);
  console.log('clockInDate (UTC):', clockInDate.toISOString());
  console.log('clockOutDate (UTC):', clockOutDate.toISOString());
  console.log('clockInTimestamp (ms):', clockInTimestamp);
  console.log('clockOutTimestamp (ms):', clockOutTimestamp);
  console.log('Difference (ms):', diffMs);
  console.log('Difference (seconds):', totalSeconds);
  console.log('Difference (hours):', totalHours.toFixed(6));
  console.log('Difference (formatted):', `${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m ${totalSeconds % 60}s`);
  console.log('=== End Calculation ===');
  
  // Determine which day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = clockOutDate.getUTCDay();
  const dayFields = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayField = dayFields[dayOfWeek];
  
  // Get current week number - Match frontend calculation
  // Frontend uses: Math.floor(diff / oneWeekInMilliseconds) + 1
  const startOfYear = new Date(clockOutDate.getFullYear(), 0, 1);
  const diff = clockOutDate.getTime() - startOfYear.getTime();
  const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
  const weekNumber = Math.floor(diff / oneWeekInMilliseconds) + 1;
  
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
  // Convert clockOut to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS) for database storage
  const clockOutTimeForDB = clockOutDate.toISOString().replace('T', ' ').substring(0, 19);
  
  const sql = `
    UPDATE workdetails 
    SET totalHours = ?,
        status = 'completed',
        weekNumber = ?,
        \`${dayField}\` = ?,
        clockOutTime = ?
    WHERE id = ?
  `;
  
  await q(sql, [
    totalHours.toFixed(2),
    String(weekNumber),
    totalHours.toFixed(2),
    clockOutTimeForDB, // Store clock-out datetime
    workDetailId
  ]);
  
  // Get updated record
  const getSql = "SELECT * FROM workdetails WHERE id = ?";
  const updated = await q(getSql, [workDetailId]);
  
  const result = updated[0] || {};
  
  // Ensure clockOutTime is included in response (from clockOutTime column)
  if (result.clockOutTime) {
    result.clockOutTime = result.clockOutTime;
  }
  
  // Include calculated totalHours in response
  result.totalHours = totalHours.toFixed(2);
  
  return sendSuccess(res, result, "Clocked out successfully");
});

export const getBioDetails = asyncHandler(async (req, res) => {
  try {
    const sql = "SELECT * FROM devicelogsinfo";
    const results = await biometricQuery(sql);
    return sendSuccess(res, results || []);
  } catch (error) {
    // Handle database errors gracefully
    console.error('Get bio details error:', error);
    
    // If table doesn't exist or database connection fails, return empty array
    if (error.code === 'ER_NO_SUCH_TABLE' || 
        error.code === 'ER_BAD_DB_ERROR' || 
        error.code === 'ECONNREFUSED' ||
        error.message?.includes('doesn\'t exist')) {
      console.warn('Biometric database or table not available, returning empty results');
      return sendSuccess(res, []);
    }
    
    // For other errors, return a proper error message
    return sendError(res, `Failed to get bio details: ${error.message || 'Database error'}`, 500);
  }
});

export const filterTimeSheet = asyncHandler(async (req, res) => {
  const { userId, logDates } = req.body;

  if (!userId || !logDates || !Array.isArray(logDates) || logDates.length === 0) {
    return sendError(res, "userId and a non-empty array of logDates are required", 400);
  }

  try {
    // Use parameterized query to prevent SQL injection
    const placeholders = logDates.map(() => "?").join(",");
    const sql = `SELECT *, DATE_FORMAT(LogDate, '%Y-%m-%d %H:%i:%s') AS FormattedLogDate 
                 FROM devicelogsinfo  
                 WHERE DATE(LogDate) IN (${placeholders}) AND UserId = ?`;

    // Combine dates and userId for parameterized query
    const params = [...logDates, userId];

    const results = await biometricQuery(sql, params);
    return sendSuccess(res, results || []);
  } catch (error) {
    // Handle database errors gracefully
    console.error('Filter timesheet error:', error);
    
    // If table doesn't exist or database connection fails, return empty array
    if (error.code === 'ER_NO_SUCH_TABLE' || 
        error.code === 'ER_BAD_DB_ERROR' || 
        error.code === 'ECONNREFUSED' ||
        error.message?.includes('doesn\'t exist')) {
      console.warn('Biometric database or table not available, returning empty results');
      return sendSuccess(res, []);
    }
    
    // For other errors, return a proper error message
    return sendError(res, `Failed to filter timesheet: ${error.message || 'Database error'}`, 500);
  }
});

