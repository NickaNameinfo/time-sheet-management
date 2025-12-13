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

