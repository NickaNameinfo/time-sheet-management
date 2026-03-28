import { query, companyQuery, getTenantQuery } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { resolveCompanyMenuEnabled } from "../utils/companyMenuPermissions.js";

export const getSettings = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  try {
    const sql = "SELECT * FROM settings ORDER BY created_at DESC";
    const results = await q(sql);
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
  const q = getTenantQuery(req);
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

  await q(sql, [values]);
  return sendSuccess(res, null, "Update created successfully");
});

export const deleteUpdate = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const sql = "DELETE FROM settings WHERE id = ?";
  await q(sql, [id]);
  return sendSuccess(res, null, "Update deleted successfully");
});

// Discipline
export const getDisciplines = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const sql = "SELECT * FROM discipline";
  const results = await q(sql);
  return sendSuccess(res, results);
});

export const createDiscipline = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const discipline = req.body.discipline;
  const discipline_code = req.body.discipline_code != null ? String(req.body.discipline_code).trim() || null : null;
  const sql = "INSERT INTO discipline (`discipline`, `discipline_code`) VALUES (?, ?)";
  await q(sql, [discipline, discipline_code]);
  return sendSuccess(res, null, "Discipline created successfully");
});

export const deleteDiscipline = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const sql = "DELETE FROM discipline WHERE id = ?";
  await q(sql, [id]);
  return sendSuccess(res, null, "Discipline deleted successfully");
});

// Designation
export const getDesignations = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const sql = "SELECT * FROM designation";
  const results = await q(sql);
  return sendSuccess(res, results);
});

export const createDesignation = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const sql = "INSERT INTO designation (`designation`) VALUES (?)";
  const values = [req.body.designation];
  await q(sql, [values]);
  return sendSuccess(res, null, "Designation created successfully");
});

export const deleteDesignation = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const sql = "DELETE FROM designation WHERE id = ?";
  await q(sql, [id]);
  return sendSuccess(res, null, "Designation deleted successfully");
});

// Area of Work
export const getAreaOfWork = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  try {
    // Check if areaofwork_projects table exists
    const checkTableSql = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'areaofwork_projects'
    `;
    const tableCheck = await q(checkTableSql);
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
      results = await q(sql);
    } else {
      // Fallback: Get areas of work without project associations
      const sql = "SELECT * FROM areaofwork ORDER BY created_at DESC";
      results = await q(sql);
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
    const results = await q(sql);
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
  const q = getTenantQuery(req);
  const { areaofwork, projectIds } = req.body;
  
  if (!areaofwork || !areaofwork.trim()) {
    return sendError(res, "Area of work is required", 400);
  }
  
  // Insert the area of work
  const insertSql = "INSERT INTO areaofwork (`areaofwork`) VALUES (?)";
  const insertResult = await q(insertSql, [areaofwork.trim()]);
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
      const tableCheck = await q(checkTableSql);
      const tableExists = tableCheck[0]?.count > 0;

      if (tableExists) {
        // Validate that all project IDs exist
        const projectIdsStr = projectIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        
        if (projectIdsStr.length > 0) {
          // Check if projects exist
          const checkSql = `SELECT id FROM project WHERE id IN (${projectIdsStr.map(() => '?').join(',')})`;
          const existingProjects = await q(checkSql, projectIdsStr);
          
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
            await q(insertAssociationsSql, associationValues);
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
  const q = getTenantQuery(req);
  const { id } = req.params;
  const { areaofwork, projectIds } = req.body;
  
  if (!areaofwork || !areaofwork.trim()) {
    return sendError(res, "Area of work is required", 400);
  }
  
  // Update the area of work
  const updateSql = "UPDATE areaofwork SET `areaofwork` = ? WHERE id = ?";
  await q(updateSql, [areaofwork.trim(), id]);
  
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
      const tableCheck = await q(checkTableSql);
      const tableExists = tableCheck[0]?.count > 0;

      if (tableExists) {
        // Delete existing associations
        const deleteSql = "DELETE FROM areaofwork_projects WHERE areaofwork_id = ?";
        await q(deleteSql, [id]);
        
        // Add new associations
        const projectIdsStr = projectIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        
        if (projectIdsStr.length > 0) {
          // Check if projects exist
          const checkSql = `SELECT id FROM project WHERE id IN (${projectIdsStr.map(() => '?').join(',')})`;
          const existingProjects = await q(checkSql, projectIdsStr);
          
          // Insert associations for existing projects
          const validProjectIds = existingProjects.map(p => p.id);
          if (validProjectIds.length > 0) {
            const insertAssociationsSql = `
              INSERT INTO areaofwork_projects (areaofwork_id, project_id) 
              VALUES ${validProjectIds.map(() => '(?, ?)').join(', ')}
            `;
            const associationValues = validProjectIds.flatMap(projectId => [id, projectId]);
            await q(insertAssociationsSql, associationValues);
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
  const q = getTenantQuery(req);
  const { id } = req.params;
  
  // Delete the area of work (cascade will automatically delete associations)
  const sql = "DELETE FROM areaofwork WHERE id = ?";
  await q(sql, [id]);
  
  return sendSuccess(res, null, "Area of work deleted successfully");
});

// Variation
export const getVariations = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const sql = "SELECT * FROM variation";
  const results = await q(sql);
  return sendSuccess(res, results);
});

export const createVariation = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const sql = "INSERT INTO variation (`variation`) VALUES (?)";
  const values = [req.body.variation];
  await q(sql, [values]);
  return sendSuccess(res, null, "Variation created successfully");
});

export const deleteVariation = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const sql = "DELETE FROM variation WHERE id = ?";
  await q(sql, [id]);
  return sendSuccess(res, null, "Variation deleted successfully");
});

// Admin Count
export const getAdminCount = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const sql = "SELECT count(id) as admin FROM users";
  const results = await q(sql);
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
    // Super admin menu: restrict to a curated set of menus only.
    // "Super admin" here is an email allowlist bypass (see userAccessController).
    // If the logged-in user is a super admin email, we return only the menus requested
    // for the super-admin console, regardless of role/menu_permissions table contents.
    //
    // IMPORTANT: req.userName is sometimes not the same as employeeEmail (e.g. admin userName = "admin@gmail.com"
    // while employeeEmail = "admin@nickname.com"). So we check employeeEmail by employee.id when available.
    let userEmail = (req.userName || "").toString().trim().toLowerCase();
    if (req.id) {
      try {
        const empRows = await query("SELECT employeeEmail FROM employee WHERE id = ? LIMIT 1", [req.id]);
        const e = (empRows?.[0]?.employeeEmail || "").toString().trim().toLowerCase();
        if (e) userEmail = e;
      } catch {
        // ignore
      }
    }
    const DEFAULT_SUPER_ADMIN_EMAIL = "admin@nickname.com";
    let isSuperAdmin = userEmail === DEFAULT_SUPER_ADMIN_EMAIL;
    if (userEmail) {
      try {
        const rows = await query(
          "SELECT setting_value FROM app_settings WHERE setting_key = 'super_admin_emails' LIMIT 1"
        );
        const raw = rows?.[0]?.setting_value;
        if (raw) {
          let list = [];
          try {
            list = JSON.parse(raw);
          } catch {
            list = String(raw)
              .split(/[\n,]+/)
              .map((e) => e.trim().toLowerCase())
              .filter(Boolean);
          }
          if (Array.isArray(list) && list.map((e) => String(e).trim().toLowerCase()).includes(userEmail)) {
            isSuperAdmin = true;
          }
        }
      } catch {
        // ignore: if app_settings doesn't exist yet, fall back to default email only
      }
    }

    if (isSuperAdmin) {
      const superAdminMenus = [
        // Root
        {
          id: 0,
          menu_key: "super_admin",
          menu_title: "Super Admin",
          menu_path: "/Dashboard/SuperAdmin",
          menu_icon: "Settings",
          parent_menu: null,
          display_order: 1,
          is_active: true,
          allowed_roles: ["Admin"],
          view_permission: [],
          add_permission: [],
          edit_permission: [],
          delete_permission: [],
          all_permission: [],
          emp_view_permission: true,
          emp_add_permission: false,
          emp_edit_permission: false,
          emp_delete_permission: false,
          emp_all_permission: false,
        },
        // Children (only the requested menus)
        {
          id: 0,
          menu_key: "superadmin_new_leads",
          menu_title: "New Leads",
          menu_path: "/Dashboard/SuperAdmin/NewLeads",
          menu_icon: "People",
          parent_menu: "super_admin",
          display_order: 1.1,
          is_active: true,
          allowed_roles: ["Admin"],
        },
        {
          id: 0,
          menu_key: "superadmin_company_list",
          menu_title: "All Company List",
          menu_path: "/Dashboard/SuperAdmin/Companies",
          menu_icon: "Business",
          parent_menu: "super_admin",
          display_order: 1.2,
          is_active: true,
          allowed_roles: ["Admin"],
        },
        {
          id: 0,
          menu_key: "superadmin_trail_version_list",
          menu_title: "Trail Version (List & Details)",
          menu_path: "/Dashboard/SuperAdmin/TrailVersions",
          menu_icon: "CalendarToday",
          parent_menu: "super_admin",
          display_order: 1.3,
          is_active: true,
          allowed_roles: ["Admin"],
        },
        {
          id: 0,
          menu_key: "superadmin_company_profile_logins",
          menu_title: "Company Profile Login List",
          menu_path: "/Dashboard/SuperAdmin/CompanyLogins",
          menu_icon: "Person",
          parent_menu: "super_admin",
          display_order: 1.4,
          is_active: true,
          allowed_roles: ["Admin"],
        },
        {
          id: 0,
          menu_key: "superadmin_company_menu_permissions",
          menu_title: "Company Menu Permission",
          menu_path: "/Dashboard/SuperAdmin/CompanyMenuPermissions",
          menu_icon: "Settings",
          parent_menu: "super_admin",
          display_order: 1.5,
          is_active: true,
          allowed_roles: ["Admin"],
        },
        {
          id: 0,
          menu_key: "superadmin_menu_trail_settings",
          menu_title: "Menu Trail Version Setting",
          menu_path: "/Dashboard/SuperAdmin/MenuTrailSettings",
          menu_icon: "CheckCircle",
          parent_menu: "super_admin",
          display_order: 1.6,
          is_active: true,
          allowed_roles: ["Admin"],
        },
        {
          id: 0,
          menu_key: "superadmin_company_subscription",
          menu_title: "Company Subscription Details",
          menu_path: "/Dashboard/SuperAdmin/CompanySubscriptions",
          menu_icon: "Payments",
          parent_menu: "super_admin",
          display_order: 1.8,
          is_active: true,
          allowed_roles: ["Admin"],
        },
        {
          id: 0,
          menu_key: "superadmin_company_billing",
          menu_title: "Company Billing Details",
          menu_path: "/Dashboard/SuperAdmin/CompanyBilling",
          menu_icon: "AccountBalance",
          parent_menu: "super_admin",
          display_order: 1.9,
          is_active: true,
          allowed_roles: ["Admin"],
        },
      ].map((m) => ({
        view_permission: [],
        add_permission: [],
        edit_permission: [],
        delete_permission: [],
        all_permission: [],
        emp_view_permission: true,
        emp_add_permission: false,
        emp_edit_permission: false,
        emp_delete_permission: false,
        emp_all_permission: false,
        ...m,
      }));

      return sendSuccess(res, superAdminMenus);
    }

    // Company user (company_users login): menus = company_menu_permissions (per company) ∩ role rules
    // company_admin → all menu_keys enabled in Super Admin "Company Menu Permission" for this company
    // company_user → Employee/HR-style tags in menu_permissions (see isCompanyRoleAllowedForMenu)
    if (req.isCompanyUser && req.company_id) {
      const companyId = Number(req.company_id);
      if (companyId) {
        try {
          // Fresh menu_role_name from DB so sidebar updates without forcing re-login after Super Admin edits
          if (req.company_user_id) {
            try {
              const cuRows = await query("SELECT menu_role_name FROM company_users WHERE id = ? LIMIT 1", [
                Number(req.company_user_id),
              ]);
              if (cuRows?.length) {
                const mn = (cuRows[0].menu_role_name ?? "").toString().trim();
                req.company_menu_role = mn || null;
              }
            } catch (e) {
              /* Missing menu_role_name column or DB error — keep JWT company_menu_role */
            }
          }

          const allMenus = await query(
            `SELECT id, menu_key, menu_title, menu_path, menu_icon, parent_menu, display_order, is_active,
             allowed_roles, view_permission, add_permission, edit_permission, delete_permission, all_permission
             FROM menu_permissions
             ORDER BY display_order ASC, menu_title ASC`
          );
          const overrides = await query(
            "SELECT menu_key, enabled FROM company_menu_permissions WHERE company_id = ?",
            [companyId]
          );
          // Super Admin "Company Menu Permission": opt-in once any row exists (see resolveCompanyMenuEnabled)
          const allowedKeys = new Set(
            (allMenus || [])
              .filter((m) => resolveCompanyMenuEnabled(m.menu_key, overrides))
              .map((m) => m.menu_key)
          );

          const parseJsonField = (field) => {
            if (!field) return [];
            try {
              if (typeof field === "string") return JSON.parse(field);
              if (Array.isArray(field)) return field;
            } catch {}
            return [];
          };

          let companyRole = (req.company_role || "company_user").toString().trim().toLowerCase();
          if (companyRole === "company admin" || companyRole.replace(/\s+/g, "") === "companyadmin") {
            companyRole = "company_admin";
          }

          /** When set on company_users (e.g. "Video Editor"), menus must list that role_name in Menu Permissions */
          let portalMenuRole = (req.company_menu_role || "").toString().trim();
          // Fallback: derive from employee.role for this login email/username (tenant DB first, then primary DB).
          // This avoids generic HR/company_user fallback when menu_role_name is not yet set on company_users.
          if (!portalMenuRole && req.userName) {
            const em = String(req.userName).trim();
            const roleLookupSql = `
              SELECT role
              FROM employee
              WHERE LOWER(TRIM(employeeEmail)) = LOWER(TRIM(?))
                 OR LOWER(TRIM(userName)) = LOWER(TRIM(?))
              ORDER BY id DESC
              LIMIT 1
            `;
            try {
              const erTenant = await companyQuery(roleLookupSql, [em, em]);
              portalMenuRole = (erTenant?.[0]?.role || "").toString().trim();
            } catch {
              // ignore tenant lookup errors, fallback to primary
            }
            if (!portalMenuRole) {
              try {
                const erPrimary = await query(roleLookupSql, [em, em]);
                portalMenuRole = (erPrimary?.[0]?.role || "").toString().trim();
              } catch {
                // ignore and keep fallback behavior
              }
            }
          }

          const normalizeRoleKey = (s) =>
            String(s ?? "")
              .trim()
              .toLowerCase()
              .replace(/\s+/g, " ");

          /**
           * For company_user only.
           * If portalMenuRole is set: show menu only where that role appears in any permission column.
           * If not set: legacy — any non-admin staff tag in the matrix (backward compatible).
           */
          const isCompanyRoleAllowedForMenu = (row) => {
            const combined = [
              ...parseJsonField(row.allowed_roles),
              ...parseJsonField(row.view_permission),
              ...parseJsonField(row.add_permission),
              ...parseJsonField(row.edit_permission),
              ...parseJsonField(row.delete_permission),
              ...parseJsonField(row.all_permission),
            ].filter((r) => r != null && String(r).trim() !== "");

            const norm = (roleIn) => normalizeRoleKey(roleIn);

            const portalKey = normalizeRoleKey(portalMenuRole);
            if (portalKey) {
              return combined.some((roleIn) => norm(roleIn) === portalKey);
            }

            const isAdminOnlyTag = (roleIn) => {
              const n = norm(roleIn);
              return n === "admin" || n === "company_admin";
            };

            const hasStaffTag = combined.some((roleIn) => {
              const n = norm(roleIn);
              if (!n) return false;
              if (n === "company_user" || n === "employee" || n === "hr") return true;
              if (row.menu_key === "dashboard" && n === "admin") return true;
              if (!isAdminOnlyTag(roleIn)) return true;
              return false;
            });

            return hasStaffTag;
          };

          /** Rows that pass company toggle + role rules */
          const keysPassing = new Set();
          for (const row of allMenus || []) {
            if (!allowedKeys.has(row.menu_key)) continue;
            if (companyRole === "company_admin") {
              keysPassing.add(row.menu_key);
              continue;
            }
            if (isCompanyRoleAllowedForMenu(row)) {
              keysPassing.add(row.menu_key);
            }
          }

          // Parent sections often have no role checkboxes; children do. Include ancestors so the sidebar tree works.
          const addAncestors = (menuKey) => {
            const row = (allMenus || []).find((m) => m.menu_key === menuKey);
            if (!row?.parent_menu) return;
            const p = row.parent_menu;
            if (allowedKeys.has(p)) {
              keysPassing.add(p);
              addAncestors(p);
            }
          };
          if (companyRole === "company_user") {
            Array.from(keysPassing).forEach((mk) => addAncestors(mk));
          }

          const formatted = (allMenus || [])
            .filter((row) => keysPassing.has(row.menu_key))
            .map((row) => ({
              id: row.id,
              menu_key: row.menu_key,
              menu_title: row.menu_title,
              menu_path: row.menu_path,
              menu_icon: row.menu_icon,
              parent_menu: row.parent_menu,
              display_order: row.display_order || 0,
              // Sidebar UIs filter with `if (!item.is_active)` — DB may store 0 after global Menu Permissions
              // while Super Admin still enabled this menu for the company. Rows here are already allowed.
              is_active: true,
              allowed_roles: parseJsonField(row.allowed_roles),
              view_permission: parseJsonField(row.view_permission),
              add_permission: parseJsonField(row.add_permission),
              edit_permission: parseJsonField(row.edit_permission),
              delete_permission: parseJsonField(row.delete_permission),
              all_permission: parseJsonField(row.all_permission),
              emp_view_permission: true,
              emp_add_permission: false,
              emp_edit_permission: false,
              emp_delete_permission: false,
              emp_all_permission: false,
            }));
          return sendSuccess(res, formatted);
        } catch (err) {
          if (err.code === "ER_NO_SUCH_TABLE") {
            return sendSuccess(res, []);
          }
          throw err;
        }
      }
    }

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
  const q = getTenantQuery(req);
  try {
    const sql = "SELECT * FROM roles WHERE is_active = TRUE ORDER BY display_order ASC, role_name ASC";
    const results = await q(sql);
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
  const q = getTenantQuery(req);
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
    await q(sql, values);
    return sendSuccess(res, null, "Role created successfully");
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, "Role name already exists", 400);
    }
    throw error;
  }
});

export const updateRole = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
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
    await q(sql, updateValues);
    return sendSuccess(res, null, "Role updated successfully");
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, "Role name already exists", 400);
    }
    throw error;
  }
});

export const deleteRole = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const sql = "DELETE FROM roles WHERE id = ?";
  await q(sql, [id]);
  return sendSuccess(res, null, "Role deleted successfully");
});

/** Default app settings (string values as stored in DB). */
const DEFAULT_APP_SETTINGS = {
  country: "UAE",
  language: "en",
  currency: "AED",
  currency_symbol: "د.إ",
  date_format: "DD/MM/YYYY",
  time_format: "24h",
  theme_primary: "#4C86F9",
  theme_success: "#49A84C",
  theme_accent: "#F6BC00",
  logo_url: "",
  admin_trail_version_emails: "[]",
  admin_trail_version_days: "30",
  admin_trail_version_list: "[]",
  admin_trail_version_companies: "[]",
};

const isCompanyRequest = (req) =>
  req.isCompanyUser === true ||
  (req.company_id != null && req.company_id !== "") ||
  (req.company_user_id != null && req.company_user_id !== "");

const mergeAppSettingsRows = (rows) => {
  const settings = {};
  (rows || []).forEach((row) => {
    settings[row.setting_key] = row.setting_value;
  });
  return { ...DEFAULT_APP_SETTINGS, ...settings };
};

/** Create app_settings in the DB pool used by q (super-admin or company tenant). */
const ensureAppSettingsTable = async (q) => {
  await q(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INT NOT NULL AUTO_INCREMENT,
      setting_key VARCHAR(100) NOT NULL,
      setting_value TEXT,
      description VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_app_settings_key (setting_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

/** Seed defaults when table is empty (company DB: skip platform-only trail keys). */
const seedAppSettingsIfEmpty = async (q, { skipTrailKeys = false } = {}) => {
  const cnt = await q("SELECT COUNT(*) AS c FROM app_settings");
  const n = Number(cnt?.[0]?.c ?? 0);
  if (n > 0) return;
  const entries = Object.entries(DEFAULT_APP_SETTINGS).filter(([k]) => {
    if (!skipTrailKeys) return true;
    return !k.startsWith("admin_trail_version_");
  });
  for (const [key, value] of entries) {
    await q("INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)", [key, value]);
  }
};

// App Settings — reads/writes tenant DB: super-admin DB for platform admins, company DB for company logins
export const getAppSettings = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const company = isCompanyRequest(req);
  try {
    await ensureAppSettingsTable(q);
    await seedAppSettingsIfEmpty(q, { skipTrailKeys: company });
    const results = await q("SELECT * FROM app_settings");
    const merged = mergeAppSettingsRows(results);
    return sendSuccess(res, merged);
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") {
      console.warn("App settings table does not exist. Returning defaults.");
      return sendSuccess(res, { ...DEFAULT_APP_SETTINGS });
    }
    throw error;
  }
});

export const updateAppSettings = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const company = isCompanyRequest(req);
  let {
    country,
    language,
    currency,
    currency_symbol,
    date_format,
    time_format,
    theme_primary,
    theme_success,
    theme_accent,
    logo_url,
    admin_trail_version_emails,
    admin_trail_version_days,
    admin_trail_version_list,
    admin_trail_version_companies,
  } = req.body;

  // Company tenants never update platform-wide trail lists (stored only in super-admin DB)
  if (company) {
    admin_trail_version_emails = undefined;
    admin_trail_version_days = undefined;
    admin_trail_version_list = undefined;
    admin_trail_version_companies = undefined;
  }

  try {
    await ensureAppSettingsTable(q);
    let trailCompaniesValue = undefined;
    if (admin_trail_version_companies !== undefined && Array.isArray(admin_trail_version_companies)) {
      const list = admin_trail_version_companies
        .map((item) => {
          const company_id = parseInt(item?.company_id ?? item?.id, 10);
          const company_name = (item?.company_name ?? "").toString().trim();
          const days = Math.max(1, Math.min(365, parseInt(item?.days ?? 30, 10) || 30));
          return company_id && company_name ? { company_id, company_name, days } : null;
        })
        .filter(Boolean);
      trailCompaniesValue = JSON.stringify(list);
    }
    let trailEmailsValue = undefined;
    if (admin_trail_version_emails !== undefined) {
      if (Array.isArray(admin_trail_version_emails)) {
        trailEmailsValue = JSON.stringify(admin_trail_version_emails.filter((e) => String(e).trim()));
      } else {
        const str = String(admin_trail_version_emails).trim();
        trailEmailsValue = str ? JSON.stringify(str.split(/[\n,]+/).map((e) => e.trim()).filter(Boolean)) : "[]";
      }
    }
    let trailDaysValue = undefined;
    if (admin_trail_version_days !== undefined) {
      const n = parseInt(admin_trail_version_days, 10);
      trailDaysValue = (Number.isNaN(n) || n < 1) ? "30" : String(Math.min(365, n));
    }
    let trailListValue = undefined;
    if (admin_trail_version_list !== undefined && Array.isArray(admin_trail_version_list)) {
      const list = admin_trail_version_list
        .map((item) => {
          const email = (item?.email ?? item).toString().trim().toLowerCase();
          const days = Math.max(1, Math.min(365, parseInt(item?.days ?? item, 10) || 30));
          return email ? { email, days } : null;
        })
        .filter(Boolean);
      trailListValue = JSON.stringify(list);
    }
    const settings = {
      country: country ?? undefined,
      language: language ?? undefined,
      currency: currency ?? undefined,
      currency_symbol: currency_symbol ?? undefined,
      date_format: date_format ?? undefined,
      time_format: time_format ?? undefined,
      theme_primary: theme_primary ?? undefined,
      theme_success: theme_success ?? undefined,
      theme_accent: theme_accent ?? undefined,
      logo_url: logo_url !== undefined ? String(logo_url).trim() || '' : undefined,
      admin_trail_version_emails: trailEmailsValue,
      admin_trail_version_days: trailDaysValue,
      admin_trail_version_list: trailListValue,
      admin_trail_version_companies: trailCompaniesValue,
    };
    // Remove undefined so we don't overwrite with undefined (except admin_trail_version_emails can be "[]")
    Object.keys(settings).forEach((k) => {
      if (settings[k] === undefined) delete settings[k];
    });
    // Defaults for required keys
    if (!settings.country) settings.country = 'UAE';
    if (!settings.language) settings.language = 'en';
    if (!settings.currency) settings.currency = 'AED';
    if (!settings.currency_symbol) settings.currency_symbol = 'د.إ';
    if (!settings.date_format) settings.date_format = 'DD/MM/YYYY';
    if (!settings.time_format) settings.time_format = '24h';
    
    // Update or insert each setting in the same DB as GET (tenant / company DB when company login)
    for (const [key, value] of Object.entries(settings)) {
      const checkSql = "SELECT id FROM app_settings WHERE setting_key = ?";
      const existing = await q(checkSql, [key]);
      
      if (existing.length > 0) {
        const updateSql = "UPDATE app_settings SET setting_value = ? WHERE setting_key = ?";
        await q(updateSql, [value, key]);
      } else {
        const insertSql = "INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)";
        await q(insertSql, [key, value]);
      }
    }

    const results = await q("SELECT * FROM app_settings");
    const merged = mergeAppSettingsRows(results);
    return sendSuccess(res, merged, "App settings updated successfully");
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return sendError(res, "App settings table does not exist. Please run the migration script.", 404);
    }
    throw error;
  }
});

// Ensure trail_version_access exists (super admin DB).
// This table tracks trial start/end for employees and company_users.
const ensureTrailVersionAccessTable = async () => {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS trail_version_access (
        id INT NOT NULL AUTO_INCREMENT,
        employee_id INT NULL DEFAULT NULL,
        company_user_id INT NULL DEFAULT NULL,
        started_at DATETIME NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_employee_id (employee_id),
        KEY idx_company_user_id (company_user_id),
        KEY idx_started_at (started_at),
        KEY idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );
  } catch (e) {
    // If CREATE is blocked by permissions, we'll surface the original error later.
  }
};

// Check if current user's email is in the admin trail version allowlist; return trial info (days used, expiry).
// On first access for an allowed email, a trail_version_access row is created (started_at = now, expires_at = now + days).
export const getAdminTrailVersionCheck = asyncHandler(async (req, res) => {
  // Company users (admin login from company): get trial days from trail_version_config (or app_settings) and track in trail_version_access
  if (req.isCompanyUser && req.company_id && req.company_user_id) {
    const companyId = Number(req.company_id);
    let days = 30;
    const fromTable = await getTrailAllowlistFromTable(null, null, companyId);
    if (fromTable.inAllowlist) {
      days = fromTable.days;
    } else {
      try {
        const rows = await query(
          "SELECT setting_value FROM app_settings WHERE setting_key = 'admin_trail_version_companies' LIMIT 1"
        );
        const raw = rows?.[0]?.setting_value;
        if (raw) {
          const list = typeof raw === "string" ? JSON.parse(raw || "[]") : raw;
          if (Array.isArray(list)) {
            const entry = list.find((e) => Number(e?.company_id ?? e?.id) === companyId);
            if (entry) days = Math.max(1, Math.min(365, parseInt(entry.days ?? 30, 10) || 30));
          }
        }
      } catch (_) { /* ignore */ }
    }
    const now = new Date();
    let trailRows;
    try {
      trailRows = await query(
        "SELECT started_at, expires_at FROM trail_version_access WHERE company_user_id = ?",
        [req.company_user_id]
      );
    } catch (err) {
      if (err.code === "ER_BAD_FIELD_ERROR" || err.code === "ER_NO_SUCH_TABLE") {
        if (err.code === "ER_NO_SUCH_TABLE") await ensureTrailVersionAccessTable();
        trailRows = [];
      } else throw err;
    }
    if (!trailRows || trailRows.length === 0) {
      const startedAt = new Date(now);
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + days);
      try {
        await query(
          "INSERT INTO trail_version_access (employee_id, company_user_id, started_at, expires_at) VALUES (NULL, ?, ?, ?)",
          [req.company_user_id, startedAt, expiresAt]
        );
      } catch (err) {
        if (err.code === "ER_NO_SUCH_TABLE") {
          await ensureTrailVersionAccessTable();
          await query(
            "INSERT INTO trail_version_access (employee_id, company_user_id, started_at, expires_at) VALUES (NULL, ?, ?, ?)",
            [req.company_user_id, startedAt, expiresAt]
          );
        } else if (err.code === "ER_BAD_FIELD_ERROR") {
          return sendSuccess(res, {
            allowed: true,
            isTrial: true,
            expired: false,
            trialDaysTotal: days,
            trialDaysUsed: 0,
            trialExpiresAt: new Date(now.getTime() + days * 86400000).toISOString(),
            trialStartedAt: now.toISOString(),
          }, "Company user - trail version (table not migrated)");
        }
        throw err;
      }
      trailRows = [{ started_at: startedAt, expires_at: expiresAt }];
    }
    const row = trailRows[0];
    const startedAt = row.started_at ? new Date(row.started_at) : now;
    const expiresAt = row.expires_at ? new Date(row.expires_at) : new Date(now.getTime() + days * 86400000);
    const trialDaysUsed = Math.max(0, Math.floor((now - startedAt) / 86400000));
    const expired = now > expiresAt;
    const allowed = !expired;
    return sendSuccess(res, {
      allowed,
      isTrial: true,
      expired,
      trialDaysTotal: days,
      trialDaysUsed,
      trialExpiresAt: expiresAt.toISOString ? expiresAt.toISOString() : expiresAt,
      trialStartedAt: startedAt.toISOString ? startedAt.toISOString() : startedAt,
    }, expired ? "Trail version expired" : "Company user - trail version");
  }
  const employeeId = req.id || req.employeeId;
  if (!employeeId) {
    return sendSuccess(res, { allowed: false, isTrial: false }, "Not authenticated");
  }
  const empRows = await query("SELECT employeeEmail, company_id FROM employee WHERE id = ?", [employeeId]);
  const email = empRows.length ? (empRows[0].employeeEmail || "").toString().trim().toLowerCase() : "";
  let employeeCompanyId = null;
  if (empRows.length > 0 && empRows[0].company_id != null) employeeCompanyId = Number(empRows[0].company_id);
  if (!email) {
    return sendSuccess(res, { allowed: false, isTrial: false }, "No email for user");
  }
  let allowed = false;
  let isTrial = false;
  let trialDaysTotal = 0;
  let trialDaysUsed = 0;
  let trialExpiresAt = null;
  let trialStartedAt = null;
  let expired = false;
  try {
    let days = 30;
    let inAllowlist = false;
    const fromTable = await getTrailAllowlistFromTable(employeeId, email, employeeCompanyId);
    if (fromTable.inAllowlist) {
      inAllowlist = true;
      days = fromTable.days;
    }
    if (!inAllowlist) {
    const settingsRows = await query(
      "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('admin_trail_version_list', 'admin_trail_version_emails', 'admin_trail_version_days', 'admin_trail_version_companies')"
    );
    const settings = {};
    (settingsRows || []).forEach((r) => { settings[r.setting_key] = r.setting_value; });
    const listRaw = settings.admin_trail_version_list;
    const emailsRaw = settings.admin_trail_version_emails;
    const companiesRaw = settings.admin_trail_version_companies;
    const daysRaw = settings.admin_trail_version_days;
    const defaultDays = Math.max(1, Math.min(365, parseInt(daysRaw, 10) || 30));
    let days = defaultDays;
    let inAllowlist = false;
    // Prefer company list: trial access from company list only when companies are configured
    let companyList = [];
    try {
      companyList = typeof companiesRaw === "string" ? JSON.parse(companiesRaw || "[]") : (companiesRaw || []);
      if (!Array.isArray(companyList)) companyList = [];
    } catch (_) { /* ignore */ }
    if (companyList.length > 0 && employeeCompanyId != null) {
      const entry = companyList.find((e) => Number(e?.company_id ?? e?.id) === employeeCompanyId);
      if (entry) {
        inAllowlist = true;
        days = Math.max(1, Math.min(365, parseInt(entry.days ?? 30, 10) || defaultDays));
      }
    }
    // Fallback: per-email list
    if (!inAllowlist && listRaw) {
      try {
        const list = typeof listRaw === "string" ? JSON.parse(listRaw) : listRaw;
        if (Array.isArray(list)) {
          const entry = list.find((e) => String(e?.email || e).trim().toLowerCase() === email);
          if (entry) {
            inAllowlist = true;
            days = Math.max(1, Math.min(365, parseInt(entry.days ?? entry, 10) || defaultDays));
          }
        }
      } catch (_) { /* ignore */ }
    }
    if (!inAllowlist && emailsRaw) {
      const list = typeof emailsRaw === "string" ? (() => { try { return JSON.parse(emailsRaw); } catch { return emailsRaw.split(/[\n,]+/).map((e) => e.trim().toLowerCase()).filter(Boolean); } })() : [];
      const allowlist = Array.isArray(list) ? list.map((e) => String(e).trim().toLowerCase()) : [];
      inAllowlist = allowlist.includes(email);
      days = defaultDays;
    }
    }
    if (!inAllowlist) {
      return sendSuccess(res, { allowed: false, isTrial: false }, "Not in trail version allowlist");
    }
    isTrial = true;
    trialDaysTotal = days;
    // Get or create trail_version_access
    let trailRows;
    try {
      trailRows = await query("SELECT started_at, expires_at FROM trail_version_access WHERE employee_id = ?", [employeeId]);
    } catch (err) {
      if (err.code === "ER_NO_SUCH_TABLE") {
        await ensureTrailVersionAccessTable();
        trailRows = await query("SELECT started_at, expires_at FROM trail_version_access WHERE employee_id = ?", [employeeId]);
      } else {
        throw err;
      }
    }
    const now = new Date();
    if (!trailRows || trailRows.length === 0) {
      const startedAt = new Date(now);
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + days);
      try {
        await query(
          "INSERT INTO trail_version_access (employee_id, started_at, expires_at) VALUES (?, ?, ?)",
          [employeeId, startedAt, expiresAt]
        );
      } catch (err) {
        if (err.code === "ER_NO_SUCH_TABLE") {
          await ensureTrailVersionAccessTable();
          await query(
            "INSERT INTO trail_version_access (employee_id, started_at, expires_at) VALUES (?, ?, ?)",
            [employeeId, startedAt, expiresAt]
          );
        } else {
          throw err;
        }
      }
      trailRows = [{ started_at: startedAt, expires_at: expiresAt }];
    }
    const row = trailRows[0];
    const startedAt = row.started_at ? new Date(row.started_at) : now;
    const expiresAt = row.expires_at ? new Date(row.expires_at) : new Date(now.getTime() + days * 86400000);
    trialStartedAt = startedAt.toISOString ? startedAt.toISOString() : startedAt;
    trialExpiresAt = expiresAt.toISOString ? expiresAt.toISOString() : expiresAt;
    trialDaysUsed = Math.max(0, Math.floor((now - startedAt) / 86400000));
    if (now > expiresAt) {
      expired = true;
      allowed = false;
    } else {
      allowed = true;
    }
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return sendSuccess(res, { allowed: false, isTrial: false }, "Trail version not configured");
    }
    throw err;
  }
  const payload = {
    allowed,
    isTrial,
    expired,
    trialDaysTotal,
    trialDaysUsed,
    trialExpiresAt,
    trialStartedAt,
  };
  return sendSuccess(
    res,
    payload,
    expired ? "Trail version expired" : allowed ? "Trail version active" : "Not in trail version allowlist"
  );
});

// ----- Trail version config (separate table) -----

async function getTrailConfigFromTable() {
  try {
    const rows = await query(
      "SELECT id, type, company_id, company_name, email, days, is_active, created_at, updated_at FROM trail_version_config WHERE is_active = 1 ORDER BY type, company_name ASC, email ASC"
    );
    return rows || [];
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") return [];
    throw err;
  }
}

/** Get default trial days from app_settings (used when no row in trail_version_config). */
async function getDefaultTrailDaysFromSettings() {
  try {
    const rows = await query("SELECT setting_value FROM app_settings WHERE setting_key = 'admin_trail_version_days' LIMIT 1");
    const raw = rows?.[0]?.setting_value;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 1 && n <= 365 ? n : 30;
  } catch {
    return 30;
  }
}

/** Check if user is in trail allowlist using trail_version_config table; returns { inAllowlist, days } or { inAllowlist: false }. */
async function getTrailAllowlistFromTable(employeeId, employeeEmail, employeeCompanyId) {
  const config = await getTrailConfigFromTable();
  const defaultDays = await getDefaultTrailDaysFromSettings();
  const email = (employeeEmail || "").toString().trim().toLowerCase();
  const companyId = employeeCompanyId != null ? Number(employeeCompanyId) : null;

  for (const row of config) {
    if (row.type === "company" && row.company_id != null && companyId != null && Number(row.company_id) === companyId) {
      const days = Math.max(1, Math.min(365, parseInt(row.days, 10) || defaultDays));
      return { inAllowlist: true, days };
    }
    if (row.type === "email" && row.email && email && row.email.toLowerCase() === email) {
      const days = Math.max(1, Math.min(365, parseInt(row.days, 10) || defaultDays));
      return { inAllowlist: true, days };
    }
  }
  return { inAllowlist: false };
}

// List all trail version config entries (for Super Admin UI)
export const getTrailVersionConfigList = asyncHandler(async (req, res) => {
  const rows = await getTrailConfigFromTable();
  const defaultDays = await getDefaultTrailDaysFromSettings();
  return sendSuccess(res, { entries: rows, default_days: defaultDays });
});

// Save trail version config (replace all entries); optional default_days in body
export const saveTrailVersionConfig = asyncHandler(async (req, res) => {
  const { entries = [], default_days } = req.body;
  const defaultDays = default_days != null ? Math.max(1, Math.min(365, parseInt(default_days, 10) || 30)) : null;

  try {
    await query("SELECT 1 FROM trail_version_config LIMIT 1");
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      await query(`
        CREATE TABLE trail_version_config (
          id INT PRIMARY KEY AUTO_INCREMENT,
          type ENUM('company','email') NOT NULL,
          company_id INT NULL DEFAULT NULL,
          company_name VARCHAR(255) NULL DEFAULT NULL,
          email VARCHAR(255) NULL DEFAULT NULL,
          days INT NOT NULL DEFAULT 30,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_type (type), KEY idx_company_id (company_id), KEY idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
    } else throw err;
  }

  await query("DELETE FROM trail_version_config");
  const list = Array.isArray(entries) ? entries : [];
  for (const e of list) {
    const type = e.type === "email" ? "email" : "company";
    const company_id = type === "company" ? (e.company_id != null ? Number(e.company_id) : null) : null;
    const company_name = type === "company" ? (e.company_name || "").toString().trim() || null : null;
    const email = type === "email" ? (e.email || "").toString().trim().toLowerCase() || null : null;
    const days = Math.max(1, Math.min(365, parseInt(e.days ?? 30, 10) || 30));
    if (type === "company" && company_id && company_name) {
      await query(
        "INSERT INTO trail_version_config (type, company_id, company_name, days) VALUES (?, ?, ?, ?)",
        [type, company_id, company_name, days]
      );
    } else if (type === "email" && email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await query("INSERT INTO trail_version_config (type, email, days) VALUES (?, ?, ?)", [type, email, days]);
    }
  }
  if (defaultDays != null) {
    try {
      const existing = await query("SELECT id FROM app_settings WHERE setting_key = 'admin_trail_version_days'");
      if (existing.length > 0) {
        await query("UPDATE app_settings SET setting_value = ? WHERE setting_key = 'admin_trail_version_days'", [String(defaultDays)]);
      } else {
        await query("INSERT INTO app_settings (setting_key, setting_value) VALUES ('admin_trail_version_days', ?)", [String(defaultDays)]);
      }
    } catch (appErr) {
      if (appErr.code !== "ER_NO_SUCH_TABLE") throw appErr;
    }
  }
  return sendSuccess(res, { entries: await getTrailConfigFromTable(), default_days: defaultDays ?? await getDefaultTrailDaysFromSettings() }, "Trail version config saved");
});

// Full trail details: config list + active access (who has trial, started_at, expires_at)
export const getTrailVersionDetails = asyncHandler(async (req, res) => {
  const config = await getTrailConfigFromTable();
  const defaultDays = await getDefaultTrailDaysFromSettings();

  let active_access = [];
  try {
    const accessRows = await query(`
      SELECT t.id, t.employee_id, t.company_user_id, t.started_at, t.expires_at,
             e.employeeName, e.employeeEmail
      FROM trail_version_access t
      LEFT JOIN employee e ON e.id = t.employee_id
      ORDER BY t.started_at DESC
    `);
    const nowMs = Date.now();
    for (const r of accessRows || []) {
      let label = r.employeeEmail || r.employeeName || (r.employee_id ? `Employee #${r.employee_id}` : null);
      if (r.company_user_id && !label) {
        const cu = await query("SELECT cu.email, c.company_name FROM company_users cu LEFT JOIN companies c ON c.id = cu.company_id WHERE cu.id = ?", [r.company_user_id]);
        label = cu?.[0]?.email ? `${cu[0].email}${cu[0].company_name ? ` (${cu[0].company_name})` : ""}` : `Company user #${r.company_user_id}`;
      }
      const exp = r.expires_at ? new Date(r.expires_at).getTime() : null;
      const isExpired = exp != null && exp < nowMs;
      const daysRemaining =
        exp != null && !isExpired ? Math.max(0, Math.ceil((exp - nowMs) / 86400000)) : null;
      active_access.push({
        id: r.id,
        employee_id: r.employee_id,
        company_user_id: r.company_user_id,
        label: label || "—",
        started_at: r.started_at,
        expires_at: r.expires_at,
        is_expired: isExpired,
        trial_status: isExpired ? "expired" : "active",
        days_remaining: daysRemaining,
      });
    }
  } catch (err) {
    if (err.code !== "ER_NO_SUCH_TABLE" && err.code !== "ER_BAD_FIELD_ERROR") throw err;
  }

  return sendSuccess(res, {
    config: config,
    default_days: defaultDays,
    active_access,
  });
});

