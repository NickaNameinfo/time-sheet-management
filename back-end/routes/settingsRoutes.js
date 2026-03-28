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
  getMenuPermissionsByEmployee,
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
  getAdminTrailVersionCheck,
} from "../controllers/settingsController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

// Settings/Updates (tenant data – use company DB for company login)
router.get("/settings", verifyUser, getSettings);
router.post("/create/updates", verifyUser, createUpdate);
router.delete("/updates/delete/:id", verifyUser, deleteUpdate);

// Discipline
router.get("/discipline", verifyUser, getDisciplines);
router.post("/create/discipline", verifyUser, createDiscipline);
router.delete("/discipline/delete/:id", verifyUser, deleteDiscipline);

// Designation
router.get("/designation", verifyUser, getDesignations);
router.post("/create/designation", verifyUser, createDesignation);
router.delete("/designation/delete/:id", verifyUser, deleteDesignation);

// Area of Work
router.get("/areaofwork", verifyUser, getAreaOfWork);
router.post("/create/areaofwork", verifyUser, createAreaOfWork);
router.put("/areaofwork/update/:id", verifyUser, updateAreaOfWork);
router.delete("/areaofwork/delete/:id", verifyUser, deleteAreaOfWork);

// Variation
router.get("/variation", verifyUser, getVariations);
router.post("/create/variation", verifyUser, createVariation);
router.delete("/variation/delete/:id", verifyUser, deleteVariation);

// Admin Count
router.get("/adminCount", verifyUser, getAdminCount);

// Menu Permissions
router.get("/menu-permissions", verifyUser, getMenuPermissions);
router.get("/menu-permissions/role", verifyUser, getMenuPermissionsByRole);
router.get("/menu-permissions/my-permissions", verifyUser, getMenuPermissionsByEmployee); // Get menus for logged-in employee
router.put("/menu-permissions/:id", verifyUser, updateMenuPermission);
router.put("/menu-permissions/admin/bulk", verifyUser, bulkUpdateMenuPermissions);

// Employee Menu Permissions
router.get("/menu-permissions/employee", verifyUser, getEmployeeMenuPermissions);
router.post("/menu-permissions/employee", verifyUser, updateEmployeeMenuPermission);
router.put("/menu-permissions/employee/bulk", verifyUser, bulkUpdateEmployeeMenuPermissions);
router.delete("/menu-permissions/employee", verifyUser, deleteEmployeeMenuPermission);

// Roles Management
router.get("/roles", verifyUser, getRoles);
router.post("/create/role", verifyUser, createRole);
router.put("/role/update/:id", verifyUser, updateRole);
router.delete("/role/delete/:id", verifyUser, deleteRole);

// App Settings
router.get("/settings/app-settings", verifyUser, getAppSettings);
router.put("/settings/app-settings", verifyUser, updateAppSettings);
router.get("/settings/app-settings/admin-trail-version-check", verifyUser, getAdminTrailVersionCheck);

export default router;

