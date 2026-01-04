import express from "express";
import {
  getSettings,
  createUpdate,
  deleteUpdate,
  getDisciplines,
  createDiscipline,
  deleteDiscipline,
  getDesignations,
  createDesignation,
  deleteDesignation,
  getAreaOfWork,
  createAreaOfWork,
  updateAreaOfWork,
  deleteAreaOfWork,
  getVariations,
  createVariation,
  deleteVariation,
  getAdminCount,
  getMenuPermissions,
  getMenuPermissionsByRole,
  updateMenuPermission,
  bulkUpdateMenuPermissions,
  getEmployeeMenuPermissions,
  updateEmployeeMenuPermission,
  bulkUpdateEmployeeMenuPermissions,
  deleteEmployeeMenuPermission,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getAppSettings,
  updateAppSettings,
} from "../controllers/settingsController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

// Settings/Updates
router.get("/settings", getSettings);
router.post("/create/updates", createUpdate);
router.delete("/updates/delete/:id", deleteUpdate);

// Discipline
router.get("/discipline", getDisciplines);
router.post("/create/discipline", createDiscipline);
router.delete("/discipline/delete/:id", deleteDiscipline);

// Designation
router.get("/designation", getDesignations);
router.post("/create/designation", createDesignation);
router.delete("/designation/delete/:id", deleteDesignation);

// Area of Work
router.get("/areaofwork", getAreaOfWork);
router.post("/create/areaofwork", createAreaOfWork);
router.put("/areaofwork/update/:id", updateAreaOfWork);
router.delete("/areaofwork/delete/:id", deleteAreaOfWork);

// Variation
router.get("/variation", getVariations);
router.post("/create/variation", createVariation);
router.delete("/variation/delete/:id", deleteVariation);

// Admin Count
router.get("/adminCount", getAdminCount);

// Menu Permissions
router.get("/menu-permissions", getMenuPermissions);
router.get("/menu-permissions/role", getMenuPermissionsByRole);
router.put("/menu-permissions/:id", updateMenuPermission);
router.put("/menu-permissions/bulk", bulkUpdateMenuPermissions);

// Employee Menu Permissions
router.get("/menu-permissions/employee", getEmployeeMenuPermissions);
router.post("/menu-permissions/employee", updateEmployeeMenuPermission);
router.put("/menu-permissions/employee/bulk", bulkUpdateEmployeeMenuPermissions);
router.delete("/menu-permissions/employee", deleteEmployeeMenuPermission);

// Roles Management
router.get("/roles", getRoles);
router.post("/create/role", createRole);
router.put("/role/update/:id", updateRole);
router.delete("/role/delete/:id", deleteRole);

// App Settings
router.get("/settings/app-settings", getAppSettings);
router.put("/settings/app-settings", verifyUser, updateAppSettings);

export default router;

