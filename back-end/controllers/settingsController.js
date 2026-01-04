import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const getSettings = asyncHandler(async (req, res) => {
  try {
    const sql = "SELECT * FROM settings ORDER BY created_at DESC";
    const results = await query(sql);
    // Return empty array if no results - this is valid
    return sendSuccess(res, results || []);
  } catch (error) {
    // If table doesn't exist, return empty array instead of error
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.warn("Settings table does not exist. Returning empty array.");
      return sendSuccess(res, []);
    }
    throw error; // Re-throw other errors
  }
});

export const createUpdate = asyncHandler(async (req, res) => {
  const sql =
    "INSERT INTO settings (`updateTitle`, `UpdateDisc`, `Announcements`, `Circular`, `Gallery`, `ViewExcel`) VALUES (?)";
  const values = [
    req.body.updateTitle,
    req.body.UpdateDisc,
    req.body.Announcements,
    req.body.Circular,
    req.body.Gallery,
    req.body.ViewExcel,
  ];

  await query(sql, [values]);
  return sendSuccess(res, null, "Update created successfully");
});

export const deleteUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM settings WHERE id = ?";
  await query(sql, [id]);
  return sendSuccess(res, null, "Update deleted successfully");
});

// Discipline
export const getDisciplines = asyncHandler(async (req, res) => {
  const sql = "SELECT * FROM discipline";
  const results = await query(sql);
  return sendSuccess(res, results);
});

export const createDiscipline = asyncHandler(async (req, res) => {
  const sql = "INSERT INTO discipline (`discipline`) VALUES (?)";
  const values = [req.body.discipline];
  await query(sql, [values]);
  return sendSuccess(res, null, "Discipline created successfully");
});

export const deleteDiscipline = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM discipline WHERE id = ?";
  await query(sql, [id]);
  return sendSuccess(res, null, "Discipline deleted successfully");
});

// Designation
export const getDesignations = asyncHandler(async (req, res) => {
  const sql = "SELECT * FROM designation";
  const results = await query(sql);
  return sendSuccess(res, results);
});

export const createDesignation = asyncHandler(async (req, res) => {
  const sql = "INSERT INTO designation (`designation`) VALUES (?)";
  const values = [req.body.designation];
  await query(sql, [values]);
  return sendSuccess(res, null, "Designation created successfully");
});

export const deleteDesignation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM designation WHERE id = ?";
  await query(sql, [id]);
  return sendSuccess(res, null, "Designation deleted successfully");
});

// Area of Work
export const getAreaOfWork = asyncHandler(async (req, res) => {
  try {
    // Check if areaofwork_projects table exists
    const checkTableSql = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'areaofwork_projects'
    `;
    const tableCheck = await query(checkTableSql);
    const tableExists = tableCheck[0]?.count > 0;

    let results;
    
    if (tableExists) {
      // Get all areas of work with their associated projects
      const sql = `
        SELECT 
          a.*,
          GROUP_CONCAT(
            JSON_OBJECT(
              'id', p.id,
              'projectName', p.projectName,
              'projectNo', p.projectNo,
              'referenceNo', p.referenceNo
            )
            SEPARATOR '|||'
          ) as projects
        FROM areaofwork a
        LEFT JOIN areaofwork_projects ap ON a.id = ap.areaofwork_id
        LEFT JOIN project p ON ap.project_id = p.id
        GROUP BY a.id
        ORDER BY a.created_at DESC
      `;
      results = await query(sql);
    } else {
      // Fallback: Get areas of work without project associations
      const sql = "SELECT * FROM areaofwork ORDER BY created_at DESC";
      results = await query(sql);
    }
    
    // Parse the projects JSON strings into arrays
    const formattedResults = results.map((row) => {
      const areaOfWork = {
        id: row.id,
        areaofwork: row.areaofwork,
        created_at: row.created_at,
        updated_at: row.updated_at,
        projects: []
      };
      
      if (row.projects) {
        try {
          // Split by ||| and parse each JSON object
          const projectStrings = row.projects.split('|||');
          areaOfWork.projects = projectStrings.map(projectStr => {
            try {
              return JSON.parse(projectStr);
            } catch (e) {
              return null;
            }
          }).filter(p => p !== null);
        } catch (e) {
          console.error('Error parsing projects:', e);
          areaOfWork.projects = [];
        }
      }
      
      return areaOfWork;
    });
    
    return sendSuccess(res, formattedResults);
  } catch (error) {
    // If there's an error, fall back to simple query
    console.warn('Error fetching area of work with projects, falling back to simple query:', error.message);
    const sql = "SELECT * FROM areaofwork ORDER BY created_at DESC";
    const results = await query(sql);
    const formattedResults = results.map((row) => ({
      id: row.id,
      areaofwork: row.areaofwork,
      created_at: row.created_at,
      updated_at: row.updated_at,
      projects: []
    }));
    return sendSuccess(res, formattedResults);
  }
});

export const createAreaOfWork = asyncHandler(async (req, res) => {
  const { areaofwork, projectIds } = req.body;
  
  if (!areaofwork || !areaofwork.trim()) {
    return sendError(res, "Area of work is required", 400);
  }
  
  // Insert the area of work
  const insertSql = "INSERT INTO areaofwork (`areaofwork`) VALUES (?)";
  const insertResult = await query(insertSql, [areaofwork.trim()]);
  const areaOfWorkId = insertResult.insertId;
  
  // If project IDs are provided, create associations (only if table exists)
  if (projectIds && Array.isArray(projectIds) && projectIds.length > 0) {
    try {
      // Check if table exists
      const checkTableSql = `
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'areaofwork_projects'
      `;
      const tableCheck = await query(checkTableSql);
      const tableExists = tableCheck[0]?.count > 0;

      if (tableExists) {
        // Validate that all project IDs exist
        const projectIdsStr = projectIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        
        if (projectIdsStr.length > 0) {
          // Check if projects exist
          const checkSql = `SELECT id FROM project WHERE id IN (${projectIdsStr.map(() => '?').join(',')})`;
          const existingProjects = await query(checkSql, projectIdsStr);
          
          if (existingProjects.length !== projectIdsStr.length) {
            // Some projects don't exist, but continue with existing ones
            console.warn('Some project IDs do not exist');
          }
          
          // Insert associations for existing projects
          const validProjectIds = existingProjects.map(p => p.id);
          if (validProjectIds.length > 0) {
            const insertAssociationsSql = `
              INSERT INTO areaofwork_projects (areaofwork_id, project_id) 
              VALUES ${validProjectIds.map(() => '(?, ?)').join(', ')}
            `;
            const associationValues = validProjectIds.flatMap(projectId => [areaOfWorkId, projectId]);
            await query(insertAssociationsSql, associationValues);
          }
        }
      }
    } catch (error) {
      console.warn('Error creating project associations (table may not exist):', error.message);
      // Continue without associations if table doesn't exist
    }
  }
  
  return sendSuccess(res, { id: areaOfWorkId }, "Area of work created successfully");
});

export const updateAreaOfWork = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { areaofwork, projectIds } = req.body;
  
  if (!areaofwork || !areaofwork.trim()) {
    return sendError(res, "Area of work is required", 400);
  }
  
  // Update the area of work
  const updateSql = "UPDATE areaofwork SET `areaofwork` = ? WHERE id = ?";
  await query(updateSql, [areaofwork.trim(), id]);
  
  // Update project associations if table exists and projectIds provided
  if (projectIds && Array.isArray(projectIds)) {
    try {
      // Check if table exists
      const checkTableSql = `
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'areaofwork_projects'
      `;
      const tableCheck = await query(checkTableSql);
      const tableExists = tableCheck[0]?.count > 0;

      if (tableExists) {
        // Delete existing associations
        const deleteSql = "DELETE FROM areaofwork_projects WHERE areaofwork_id = ?";
        await query(deleteSql, [id]);
        
        // Add new associations
        const projectIdsStr = projectIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        
        if (projectIdsStr.length > 0) {
          // Check if projects exist
          const checkSql = `SELECT id FROM project WHERE id IN (${projectIdsStr.map(() => '?').join(',')})`;
          const existingProjects = await query(checkSql, projectIdsStr);
          
          // Insert associations for existing projects
          const validProjectIds = existingProjects.map(p => p.id);
          if (validProjectIds.length > 0) {
            const insertAssociationsSql = `
              INSERT INTO areaofwork_projects (areaofwork_id, project_id) 
              VALUES ${validProjectIds.map(() => '(?, ?)').join(', ')}
            `;
            const associationValues = validProjectIds.flatMap(projectId => [id, projectId]);
            await query(insertAssociationsSql, associationValues);
          }
        }
      }
    } catch (error) {
      console.warn('Error updating project associations:', error.message);
      // Continue even if associations fail
    }
  }
  
  return sendSuccess(res, { id }, "Area of work updated successfully");
});

export const deleteAreaOfWork = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Delete the area of work (cascade will automatically delete associations)
  const sql = "DELETE FROM areaofwork WHERE id = ?";
  await query(sql, [id]);
  
  return sendSuccess(res, null, "Area of work deleted successfully");
});

// Variation
export const getVariations = asyncHandler(async (req, res) => {
  const sql = "SELECT * FROM variation";
  const results = await query(sql);
  return sendSuccess(res, results);
});

export const createVariation = asyncHandler(async (req, res) => {
  const sql = "INSERT INTO variation (`variation`) VALUES (?)";
  const values = [req.body.variation];
  await query(sql, [values]);
  return sendSuccess(res, null, "Variation created successfully");
});

export const deleteVariation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM variation WHERE id = ?";
  await query(sql, [id]);
  return sendSuccess(res, null, "Variation deleted successfully");
});

// Admin Count
export const getAdminCount = asyncHandler(async (req, res) => {
  const sql = "SELECT count(id) as admin FROM users";
  const results = await query(sql);
  return sendSuccess(res, results[0]);
});

// Menu Permissions
export const getMenuPermissions = asyncHandler(async (req, res) => {
  try {
    const sql = `
      SELECT * FROM menu_permissions 
      ORDER BY display_order ASC, menu_title ASC
    `;
    const results = await query(sql);
    
    // Parse JSON permissions for each menu item
    const parseJsonField = (field) => {
      if (!field) return [];
      try {
        if (typeof field === 'string') {
          return JSON.parse(field);
        } else if (Array.isArray(field)) {
          return field;
        }
      } catch (e) {
        console.error(`Error parsing ${field}:`, e);
      }
      return [];
    };
    
    const formattedResults = results.map((row) => {
      return {
        ...row,
        allowed_roles: parseJsonField(row.allowed_roles),
        view_permission: parseJsonField(row.view_permission),
        add_permission: parseJsonField(row.add_permission),
        edit_permission: parseJsonField(row.edit_permission),
        delete_permission: parseJsonField(row.delete_permission),
        all_permission: parseJsonField(row.all_permission),
      };
    });
    
    return sendSuccess(res, formattedResults);
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.warn("Menu permissions table does not exist. Returning empty array.");
      return sendSuccess(res, []);
    }
    throw error;
  }
});

export const getMenuPermissionsByRole = asyncHandler(async (req, res) => {
  const { role } = req.query;
  
  if (!role) {
    return sendError(res, "Role is required", 400);
  }
  
  try {
    const sql = `
      SELECT * FROM menu_permissions 
      WHERE is_active = TRUE
      AND JSON_CONTAINS(allowed_roles, ?)
      ORDER BY display_order ASC, menu_title ASC
    `;
    const roleJson = JSON.stringify(role);
    const results = await query(sql, [roleJson]);
    
    // Parse JSON allowed_roles and format results
    const formattedResults = results.map((row) => {
      let allowedRoles = [];
      try {
        if (typeof row.allowed_roles === 'string') {
          allowedRoles = JSON.parse(row.allowed_roles);
        } else if (Array.isArray(row.allowed_roles)) {
          allowedRoles = row.allowed_roles;
        }
      } catch (e) {
        console.error('Error parsing allowed_roles:', e);
        allowedRoles = [];
      }
      
      return {
        ...row,
        allowed_roles: allowedRoles,
      };
    });
    
    return sendSuccess(res, formattedResults);
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.warn("Menu permissions table does not exist. Returning empty array.");
      return sendSuccess(res, []);
    }
    throw error;
  }
});

export const updateMenuPermission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    allowed_roles, 
    is_active, 
    display_order,
    view_permission,
    add_permission,
    edit_permission,
    delete_permission,
    all_permission
  } = req.body;
  
  try {
    let updateFields = [];
    let updateValues = [];
    
    const addJsonField = (fieldName, value) => {
      if (value !== undefined) {
        const rolesJson = JSON.stringify(Array.isArray(value) ? value : [value]);
        updateFields.push(`${fieldName} = ?`);
        updateValues.push(rolesJson);
      }
    };
    
    addJsonField("allowed_roles", allowed_roles);
    addJsonField("view_permission", view_permission);
    addJsonField("add_permission", add_permission);
    addJsonField("edit_permission", edit_permission);
    addJsonField("delete_permission", delete_permission);
    addJsonField("all_permission", all_permission);
    
    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      updateValues.push(is_active);
    }
    
    if (display_order !== undefined) {
      updateFields.push("display_order = ?");
      updateValues.push(display_order);
    }
    
    if (updateFields.length === 0) {
      return sendError(res, "No fields to update", 400);
    }
    
    updateValues.push(id);
    const sql = `UPDATE menu_permissions SET ${updateFields.join(", ")} WHERE id = ?`;
    await query(sql, updateValues);
    
    return sendSuccess(res, null, "Menu permission updated successfully");
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return sendError(res, "Menu permissions table does not exist", 404);
    }
    throw error;
  }
});

export const bulkUpdateMenuPermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body;
  
  if (!Array.isArray(permissions)) {
    return sendError(res, "Permissions must be an array", 400);
  }
  
  try {
    // Use transaction-like approach
    for (const perm of permissions) {
      const { 
        id, 
        allowed_roles, 
        is_active, 
        display_order,
        view_permission,
        add_permission,
        edit_permission,
        delete_permission,
        all_permission
      } = perm;
      
      if (!id) continue;
      
      let updateFields = [];
      let updateValues = [];
      
      const addJsonField = (fieldName, value) => {
        if (value !== undefined) {
          const rolesJson = JSON.stringify(Array.isArray(value) ? value : [value]);
          updateFields.push(`${fieldName} = ?`);
          updateValues.push(rolesJson);
        }
      };
      
      addJsonField("allowed_roles", allowed_roles);
      addJsonField("view_permission", view_permission);
      addJsonField("add_permission", add_permission);
      addJsonField("edit_permission", edit_permission);
      addJsonField("delete_permission", delete_permission);
      addJsonField("all_permission", all_permission);
      
      if (is_active !== undefined) {
        updateFields.push("is_active = ?");
        updateValues.push(is_active);
      }
      
      if (display_order !== undefined) {
        updateFields.push("display_order = ?");
        updateValues.push(display_order);
      }
      
      if (updateFields.length > 0) {
        updateValues.push(id);
        const sql = `UPDATE menu_permissions SET ${updateFields.join(", ")} WHERE id = ?`;
        await query(sql, updateValues);
      }
    }
    
    return sendSuccess(res, null, "Menu permissions updated successfully");
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return sendError(res, "Menu permissions table does not exist", 404);
    }
    throw error;
  }
});

// Employee Menu Permissions
export const getEmployeeMenuPermissions = asyncHandler(async (req, res) => {
  const { menuPermissionId } = req.query;
  
  try {
    let sql = `
      SELECT 
        mep.*,
        e.id as employee_id,
        e.employeeName,
        e.EMPID,
        mp.menu_key,
        mp.menu_title
      FROM menu_employee_permissions mep
      INNER JOIN employee e ON mep.employee_id = e.id
      INNER JOIN menu_permissions mp ON mep.menu_permission_id = mp.id
    `;
    
    const params = [];
    if (menuPermissionId) {
      sql += " WHERE mep.menu_permission_id = ?";
      params.push(menuPermissionId);
    }
    
    sql += " ORDER BY e.employeeName ASC";
    
    const results = await query(sql, params);
    return sendSuccess(res, results);
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.warn("Menu employee permissions table does not exist. Returning empty array.");
      return sendSuccess(res, []);
    }
    throw error;
  }
});

export const updateEmployeeMenuPermission = asyncHandler(async (req, res) => {
  const { menuPermissionId, employeeId, view_permission, add_permission, edit_permission, delete_permission, all_permission } = req.body;
  
  if (!menuPermissionId || !employeeId) {
    return sendError(res, "menuPermissionId and employeeId are required", 400);
  }
  
  try {
    // Check if record exists
    const checkSql = "SELECT id FROM menu_employee_permissions WHERE menu_permission_id = ? AND employee_id = ?";
    const existing = await query(checkSql, [menuPermissionId, employeeId]);
    
    if (existing.length > 0) {
      // Update existing record
      const updateSql = `
        UPDATE menu_employee_permissions 
        SET view_permission = ?,
            add_permission = ?,
            edit_permission = ?,
            delete_permission = ?,
            all_permission = ?
        WHERE menu_permission_id = ? AND employee_id = ?
      `;
      await query(updateSql, [
        view_permission || false,
        add_permission || false,
        edit_permission || false,
        delete_permission || false,
        all_permission || false,
        menuPermissionId,
        employeeId
      ]);
    } else {
      // Insert new record
      const insertSql = `
        INSERT INTO menu_employee_permissions 
        (menu_permission_id, employee_id, view_permission, add_permission, edit_permission, delete_permission, all_permission)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      await query(insertSql, [
        menuPermissionId,
        employeeId,
        view_permission || false,
        add_permission || false,
        edit_permission || false,
        delete_permission || false,
        all_permission || false
      ]);
    }
    
    return sendSuccess(res, null, "Employee menu permission updated successfully");
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return sendError(res, "Menu employee permissions table does not exist", 404);
    }
    throw error;
  }
});

export const bulkUpdateEmployeeMenuPermissions = asyncHandler(async (req, res) => {
  const { menuPermissionId, employeePermissions } = req.body;
  
  if (!menuPermissionId) {
    return sendError(res, "menuPermissionId is required", 400);
  }
  
  if (!Array.isArray(employeePermissions)) {
    return sendError(res, "employeePermissions must be an array", 400);
  }
  
  try {
    // Delete existing permissions for this menu
    const deleteSql = "DELETE FROM menu_employee_permissions WHERE menu_permission_id = ?";
    await query(deleteSql, [menuPermissionId]);
    
    // Insert new permissions
    if (employeePermissions.length > 0) {
      const insertSql = `
        INSERT INTO menu_employee_permissions 
        (menu_permission_id, employee_id, view_permission, add_permission, edit_permission, delete_permission, all_permission)
        VALUES ?
      `;
      
      const values = employeePermissions.map(ep => [
        menuPermissionId,
        ep.employee_id,
        ep.view_permission || false,
        ep.add_permission || false,
        ep.edit_permission || false,
        ep.delete_permission || false,
        ep.all_permission || false
      ]);
      
      await query(insertSql, [values]);
    }
    
    return sendSuccess(res, null, "Employee menu permissions updated successfully");
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return sendError(res, "Menu employee permissions table does not exist", 404);
    }
    throw error;
  }
});

export const deleteEmployeeMenuPermission = asyncHandler(async (req, res) => {
  const { menuPermissionId, employeeId } = req.query;
  
  if (!menuPermissionId || !employeeId) {
    return sendError(res, "menuPermissionId and employeeId are required", 400);
  }
  
  try {
    const sql = "DELETE FROM menu_employee_permissions WHERE menu_permission_id = ? AND employee_id = ?";
    await query(sql, [menuPermissionId, employeeId]);
    return sendSuccess(res, null, "Employee menu permission deleted successfully");
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return sendError(res, "Menu employee permissions table does not exist", 404);
    }
    throw error;
  }
});

// Roles Management
export const getRoles = asyncHandler(async (req, res) => {
  try {
    const sql = "SELECT * FROM roles WHERE is_active = TRUE ORDER BY display_order ASC, role_name ASC";
    const results = await query(sql);
    return sendSuccess(res, results);
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.warn("Roles table does not exist. Returning empty array.");
      return sendSuccess(res, []);
    }
    throw error;
  }
});

export const createRole = asyncHandler(async (req, res) => {
  const { role_name, role_display_name, role_color, display_order } = req.body;
  
  if (!role_name || !role_display_name) {
    return sendError(res, "Role name and display name are required", 400);
  }
  
  try {
    const sql = "INSERT INTO roles (`role_name`, `role_display_name`, `role_color`, `display_order`) VALUES (?, ?, ?, ?)";
    const values = [
      role_name,
      role_display_name,
      role_color || 'default',
      display_order || 0
    ];
    await query(sql, values);
    return sendSuccess(res, null, "Role created successfully");
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, "Role name already exists", 400);
    }
    throw error;
  }
});

export const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role_name, role_display_name, role_color, is_active, display_order } = req.body;
  
  try {
    let updateFields = [];
    let updateValues = [];
    
    if (role_name !== undefined) {
      updateFields.push("role_name = ?");
      updateValues.push(role_name);
    }
    if (role_display_name !== undefined) {
      updateFields.push("role_display_name = ?");
      updateValues.push(role_display_name);
    }
    if (role_color !== undefined) {
      updateFields.push("role_color = ?");
      updateValues.push(role_color);
    }
    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      updateValues.push(is_active);
    }
    if (display_order !== undefined) {
      updateFields.push("display_order = ?");
      updateValues.push(display_order);
    }
    
    if (updateFields.length === 0) {
      return sendError(res, "No fields to update", 400);
    }
    
    updateValues.push(id);
    const sql = `UPDATE roles SET ${updateFields.join(", ")} WHERE id = ?`;
    await query(sql, updateValues);
    return sendSuccess(res, null, "Role updated successfully");
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, "Role name already exists", 400);
    }
    throw error;
  }
});

export const deleteRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM roles WHERE id = ?";
  await query(sql, [id]);
  return sendSuccess(res, null, "Role deleted successfully");
});

// App Settings
export const getAppSettings = asyncHandler(async (req, res) => {
  try {
    const sql = "SELECT * FROM app_settings";
    const results = await query(sql);
    
    // Convert array to object for easier access
    const settings = {};
    results.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });
    
    return sendSuccess(res, settings);
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.warn("App settings table does not exist. Returning defaults.");
      return sendSuccess(res, {
        country: 'UAE',
        language: 'en',
        currency: 'AED',
        currency_symbol: 'د.إ',
        date_format: 'DD/MM/YYYY',
        time_format: '24h',
      });
    }
    throw error;
  }
});

export const updateAppSettings = asyncHandler(async (req, res) => {
  const { country, language, currency, currency_symbol, date_format, time_format } = req.body;
  
  try {
    const settings = {
      country: country || 'UAE',
      language: language || 'en',
      currency: currency || 'AED',
      currency_symbol: currency_symbol || 'د.إ',
      date_format: date_format || 'DD/MM/YYYY',
      time_format: time_format || '24h',
    };
    
    // Update or insert each setting
    for (const [key, value] of Object.entries(settings)) {
      const checkSql = "SELECT id FROM app_settings WHERE setting_key = ?";
      const existing = await query(checkSql, [key]);
      
      if (existing.length > 0) {
        // Update existing
        const updateSql = "UPDATE app_settings SET setting_value = ? WHERE setting_key = ?";
        await query(updateSql, [value, key]);
      } else {
        // Insert new
        const insertSql = "INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)";
        await query(insertSql, [key, value]);
      }
    }
    
    return sendSuccess(res, settings, "App settings updated successfully");
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return sendError(res, "App settings table does not exist. Please run the migration script.", 404);
    }
    throw error;
  }
});

