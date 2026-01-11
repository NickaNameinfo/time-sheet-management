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

// Get menu permissions for logged-in employee (considers both role and employee-specific permissions)
export const getMenuPermissionsByEmployee = asyncHandler(async (req, res) => {
  // IMPORTANT: req.id is the employee.id from database (used in menu_employee_permissions.employee_id)
  // req.employeeId is the EMPID (employee number), NOT the database ID
  // We need to use req.id (employee.id) for the JOIN, not req.employeeId (EMPID)
  const employeeId = req.id; // This is the employee.id from database
  const role = req.role; // From auth middleware
  
  console.log("getMenuPermissionsByEmployee called with:", { 
    employeeId: req.id, // employee.id from database
    employeeId_EMPID: req.employeeId, // EMPID (employee number)
    role,
    reqEmployeeName: req.employeeName
  });
  
  // If no employeeId, try to resolve from EMPID
  let dbEmployeeId = employeeId;
  if (!dbEmployeeId && req.employeeId) {
    try {
      // Find employee.id by EMPID
      const empCheckSql = "SELECT id FROM employee WHERE EMPID = ? LIMIT 1";
      const empCheck = await query(empCheckSql, [req.employeeId]);
      if (empCheck.length > 0) {
        dbEmployeeId = empCheck[0].id;
        console.log(`Resolved employeeId from EMPID ${req.employeeId} -> ${dbEmployeeId}`);
      }
    } catch (err) {
      console.warn("Could not resolve employee ID from EMPID:", err.message);
    }
  }
  
  if (!role) {
    return sendError(res, "Role is required", 400);
  }
  
  try {
    // Normalize role - handle both "admin" and "Admin"
    const normalizedRole = role.trim().toLowerCase();
    const roleVariations = [normalizedRole];
    
    // Add capitalized version for admin
    if (normalizedRole === 'admin') {
      roleVariations.push('Admin');
    } else if (normalizedRole === 'hr') {
      roleVariations.push('HR');
    } else if (normalizedRole === 'tl' || normalizedRole === 'teamlead') {
      roleVariations.push('TL', 'TeamLead');
    } else if (normalizedRole === 'employee') {
      roleVariations.push('Employee');
    }
    
    // Get all active menu permissions
    // Use COALESCE to handle NULL values from LEFT JOIN
    let sql = `
      SELECT 
        mp.*,
        COALESCE(mep.view_permission, 0) as emp_view_permission,
        COALESCE(mep.add_permission, 0) as emp_add_permission,
        COALESCE(mep.edit_permission, 0) as emp_edit_permission,
        COALESCE(mep.delete_permission, 0) as emp_delete_permission,
        COALESCE(mep.all_permission, 0) as emp_all_permission
      FROM menu_permissions mp
      LEFT JOIN menu_employee_permissions mep ON mp.id = mep.menu_permission_id AND mep.employee_id = ?
      WHERE mp.is_active = TRUE
    `;
    
    const params = dbEmployeeId ? [dbEmployeeId] : [null];
    
    console.log(`Querying menu permissions with employeeId (db): ${dbEmployeeId}, role: ${role}`);
    
    sql += " ORDER BY mp.display_order ASC, mp.menu_title ASC";
    
    const results = await query(sql, params);
    
    console.log(`Found ${results.length} active menu permissions`);
    
    // Helper to parse JSON fields
    const parseJsonField = (field) => {
      if (!field) return [];
      try {
        if (typeof field === 'string') {
          return JSON.parse(field);
        } else if (Array.isArray(field)) {
          return field;
        }
      } catch (e) {
        return [];
      }
      return [];
    };
    
    // Helper to check if role matches (case-insensitive)
    const roleMatches = (roleInArray) => {
      if (!roleInArray) return false;
      const normalized = roleInArray.trim().toLowerCase();
      return roleVariations.some(variation => variation.toLowerCase() === normalized);
    };
    
    // Filter and format results based on permissions
    const formattedResults = results
      .map((row) => {
        const allowedRoles = parseJsonField(row.allowed_roles);
        const viewPermission = parseJsonField(row.view_permission);
        const addPermission = parseJsonField(row.add_permission);
        const editPermission = parseJsonField(row.edit_permission);
        const deletePermission = parseJsonField(row.delete_permission);
        const allPermission = parseJsonField(row.all_permission);
        
        // Check if employee has view permission
        let canView = false;
        let permissionSource = 'none';
        
        // Check employee-specific permissions first (they override role permissions)
        // Note: emp_view_permission and emp_all_permission come from the LEFT JOIN as 0/1 (tinyint) or NULL
        if (dbEmployeeId) {
          // Convert to boolean - MySQL returns 0/1 as numbers, need to check explicitly
          const empAllPermission = row.emp_all_permission === 1 || row.emp_all_permission === true || row.emp_all_permission === '1';
          const empViewPermission = row.emp_view_permission === 1 || row.emp_view_permission === true || row.emp_view_permission === '1';
          
          console.log(`Menu ${row.menu_key} (id: ${row.id}) - Employee ${dbEmployeeId} permissions:`, {
            emp_all_permission: row.emp_all_permission,
            emp_view_permission: row.emp_view_permission,
            empAllPermission,
            empViewPermission
          });
          
          // Check if employee has all_permission (1 = true, 0 = false, NULL = no permission set)
          if (empAllPermission) {
            canView = true;
            permissionSource = 'employee_all_permission';
            console.log(`✓ Employee ${dbEmployeeId} has all_permission for menu ${row.menu_key}`);
          } 
          // Check if employee has view_permission
          else if (empViewPermission) {
            canView = true;
            permissionSource = 'employee_view_permission';
            console.log(`✓ Employee ${dbEmployeeId} has view_permission for menu ${row.menu_key}`);
          }
        }
        
        // If no employee-specific permission, check role-based permissions
        if (!canView) {
          // Check all_permission first (highest priority)
          const hasAllPermission = allPermission.some(roleMatches);
          if (hasAllPermission) {
            canView = true;
            permissionSource = 'role_all_permission';
            console.log(`✓ Role ${role} has all_permission for menu ${row.menu_key}`);
          } else {
            // Check view_permission
            const hasViewPermission = viewPermission.some(roleMatches);
            // Or check allowed_roles (legacy support)
            const hasAllowedRole = allowedRoles.some(roleMatches);
            canView = hasViewPermission || hasAllowedRole;
            if (canView) {
              permissionSource = hasViewPermission ? 'role_view_permission' : 'role_allowed_roles';
              console.log(`✓ Role ${role} has ${permissionSource} for menu ${row.menu_key}`);
            } else {
              console.log(`✗ No permission for menu ${row.menu_key} - role: ${role}, allowed_roles: ${JSON.stringify(allowedRoles)}, view_permission: ${JSON.stringify(viewPermission)}`);
            }
          }
        }
        
        // Only return menus the employee can view
        if (!canView) return null;
        
        return {
          id: row.id,
          menu_key: row.menu_key,
          menu_title: row.menu_title,
          menu_path: row.menu_path,
          menu_icon: row.menu_icon,
          parent_menu: row.parent_menu,
          display_order: row.display_order || 0,
          is_active: row.is_active,
          allowed_roles: allowedRoles,
          view_permission: viewPermission,
          add_permission: addPermission,
          edit_permission: editPermission,
          delete_permission: deletePermission,
          all_permission: allPermission,
          // Employee-specific permissions
          emp_view_permission: row.emp_view_permission || false,
          emp_add_permission: row.emp_add_permission || false,
          emp_edit_permission: row.emp_edit_permission || false,
          emp_delete_permission: row.emp_delete_permission || false,
          emp_all_permission: row.emp_all_permission || false,
        };
      })
      .filter(item => item !== null); // Remove null items (menus without permission)
    
    console.log(`Returning ${formattedResults.length} menus for role: ${role} (normalized: ${normalizedRole})`);
    
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
  console.log("bulkUpdateMenuPermissions called");
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  const { permissions } = req.body;

  if (!Array.isArray(permissions) || permissions.length === 0) {
    return sendError(res, "Permissions array is required", 400);
  }

  try {
    /* --------------------------------------------------
       CHECK EXISTING COLUMNS (SAFE DEFAULT = TRUE)
    -------------------------------------------------- */
    let hasViewPermission = true;
    let hasAddPermission = true;
    let hasEditPermission = true;
    let hasDeletePermission = true;
    let hasAllPermission = true;

    try {
      const cols = await query(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE table_schema = DATABASE()
        AND table_name = 'menu_permissions'
      `);

      const names = cols.map(c => c.COLUMN_NAME);
      hasViewPermission = names.includes("view_permission");
      hasAddPermission = names.includes("add_permission");
      hasEditPermission = names.includes("edit_permission");
      hasDeletePermission = names.includes("delete_permission");
      hasAllPermission = names.includes("all_permission");
    } catch (e) {
      console.warn("Column check skipped:", e.message);
    }

    let updated = 0;
    let errors = [];

    /* --------------------------------------------------
       LOOP PERMISSIONS
    -------------------------------------------------- */
    for (const perm of permissions) {
      console.log("Processing:", perm);

      const { id } = perm;
      if (!id) {
        errors.push("Missing id");
        continue;
      }

      let updateFields = [];
      let updateValues = [];

      /* --------------------------------------------------
         ALWAYS UPDATE allowed_roles (DEFAULT [])
      -------------------------------------------------- */
      const allowedRoles =
        perm.allowed_roles === null
          ? null
          : JSON.stringify(
              Array.isArray(perm.allowed_roles)
                ? perm.allowed_roles
                : []
            );

      updateFields.push("allowed_roles = ?");
      updateValues.push(allowedRoles);

      /* --------------------------------------------------
         HELPER FOR JSON COLUMNS
      -------------------------------------------------- */
      const jsonField = (col, exists) => {
        if (!exists) return;
        if (!Object.prototype.hasOwnProperty.call(perm, col)) return;

        updateFields.push(`${col} = ?`);
        updateValues.push(
          perm[col] === null
            ? null
            : JSON.stringify(Array.isArray(perm[col]) ? perm[col] : [])
        );
      };

      jsonField("view_permission", hasViewPermission);
      jsonField("add_permission", hasAddPermission);
      jsonField("edit_permission", hasEditPermission);
      jsonField("delete_permission", hasDeletePermission);
      jsonField("all_permission", hasAllPermission);

      /* --------------------------------------------------
         is_active (0 OR 1 SAFE)
      -------------------------------------------------- */
      if (Object.prototype.hasOwnProperty.call(perm, "is_active")) {
        updateFields.push("is_active = ?");
        updateValues.push(Number(perm.is_active));
      }

      /* --------------------------------------------------
         display_order
      -------------------------------------------------- */
      if (Object.prototype.hasOwnProperty.call(perm, "display_order")) {
        updateFields.push("display_order = ?");
        updateValues.push(perm.display_order);
      }

      /* --------------------------------------------------
         EXECUTE (NO EMPTY CHECK ❌ REMOVED)
      -------------------------------------------------- */
      const sql = `
        UPDATE menu_permissions
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `;

      updateValues.push(id);

      console.log("SQL:", sql);
      console.log("VALUES:", updateValues);

      try {
        await query(sql, updateValues);
        updated++;
      } catch (err) {
        console.error(err);
        errors.push(`ID ${id}: ${err.message}`);
      }
    }

    if (updated === 0) {
      return sendError(res, errors.join("; ") || "No records updated", 400);
    }

    return sendSuccess(
      res,
      { updated, errors },
      "Menu permissions updated successfully"
    );
  } catch (err) {
    console.error(err);
    return sendError(res, err.message || "Internal Server Error", 500);
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
  
  console.log("updateEmployeeMenuPermission called with:", {
    menuPermissionId,
    employeeId,
    view_permission,
    add_permission,
    edit_permission,
    delete_permission,
    all_permission
  });
  
  if (!menuPermissionId || !employeeId) {
    return sendError(res, "menuPermissionId and employeeId are required", 400);
  }
  
  try {
    // Convert boolean values to 1/0 for MySQL
    // Handle both boolean and number inputs (true/1 = 1, false/0 = 0)
    const toBoolean = (val) => {
      if (val === true || val === 1 || val === '1' || val === 'true') return 1;
      if (val === false || val === 0 || val === '0' || val === 'false' || val === null || val === undefined) return 0;
      return val ? 1 : 0;
    };
    
    const viewPerm = toBoolean(view_permission);
    const addPerm = toBoolean(add_permission);
    const editPerm = toBoolean(edit_permission);
    const deletePerm = toBoolean(delete_permission);
    const allPerm = toBoolean(all_permission);
    
    console.log("Converted permissions:", {
      viewPerm,
      addPerm,
      editPerm,
      deletePerm,
      allPerm
    });
    
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
            all_permission = ?,
            updated_at = NOW()
        WHERE menu_permission_id = ? AND employee_id = ?
      `;
      await query(updateSql, [
        viewPerm,
        addPerm,
        editPerm,
        deletePerm,
        allPerm,
        menuPermissionId,
        employeeId
      ]);
      console.log(`Updated employee permission for menu ${menuPermissionId}, employee ${employeeId}`);
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
        viewPerm,
        addPerm,
        editPerm,
        deletePerm,
        allPerm
      ]);
      console.log(`Inserted new employee permission for menu ${menuPermissionId}, employee ${employeeId}`);
    }
    
    return sendSuccess(res, null, "Employee menu permission updated successfully");
  } catch (error) {
    console.error("Error updating employee menu permission:", error);
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
      
      // Convert boolean values to 1/0 for MySQL
      const toBoolean = (val) => {
        if (val === true || val === 1 || val === '1' || val === 'true') return 1;
        if (val === false || val === 0 || val === '0' || val === 'false' || val === null || val === undefined) return 0;
        return val ? 1 : 0;
      };
      
      const values = employeePermissions.map(ep => [
        menuPermissionId,
        ep.employee_id,
        toBoolean(ep.view_permission),
        toBoolean(ep.add_permission),
        toBoolean(ep.edit_permission),
        toBoolean(ep.delete_permission),
        toBoolean(ep.all_permission)
      ]);
      
      console.log(`Bulk updating ${values.length} employee permissions for menu ${menuPermissionId}`);
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

