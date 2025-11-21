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
  const sql = "SELECT * FROM areaofwork";
  const results = await query(sql);
  return sendSuccess(res, results);
});

export const createAreaOfWork = asyncHandler(async (req, res) => {
  const sql = "INSERT INTO areaofwork (`areaofwork`) VALUES (?)";
  const values = [req.body.areaofwork];
  await query(sql, [values]);
  return sendSuccess(res, null, "Area of work created successfully");
});

export const deleteAreaOfWork = asyncHandler(async (req, res) => {
  const { id } = req.params;
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

