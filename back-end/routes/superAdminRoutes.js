import express from "express";
import { verifyUser } from "../middleware/auth.js";
import { requireSuperAdmin } from "../middleware/superAdmin.js";
import {
  listCompanyLoginRequestsAdmin,
  approveCompanyLoginRequest,
  rejectCompanyLoginRequest,
} from "../controllers/companyLoginRequestController.js";
import {
  listCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  listLeadCompanies,
  listCompanyUsers,
  createCompanyUser,
  updateCompanyUser,
  deleteCompanyUser,
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  listBilling,
  createBilling,
  updateBilling,
  deleteBilling,
  getCompanyMenuPermissions,
  setCompanyMenuPermissions,
  getCompanyMenuTrialSettings,
  setCompanyMenuTrialSettings,
} from "../controllers/superAdminController.js";
import {
  getTrailVersionConfigList,
  saveTrailVersionConfig,
  getTrailVersionDetails,
} from "../controllers/settingsController.js";

const router = express.Router();

// All super-admin APIs require auth + super admin email
router.use("/super-admin", verifyUser, requireSuperAdmin);

// Companies
router.get("/super-admin/companies", listCompanies);
router.post("/super-admin/companies", createCompany);
router.put("/super-admin/companies/:id", updateCompany);
router.delete("/super-admin/companies/:id", deleteCompany);
router.get("/super-admin/lead-companies", listLeadCompanies);

// Company users (profile logins)
router.get("/super-admin/company-users", listCompanyUsers);
router.post("/super-admin/company-users", createCompanyUser);
router.put("/super-admin/company-users/:id", updateCompanyUser);
router.delete("/super-admin/company-users/:id", deleteCompanyUser);

// Pending company login requests (company admin → Super Admin approval)
router.get("/super-admin/company-login-requests", listCompanyLoginRequestsAdmin);
router.post("/super-admin/company-login-requests/:id/approve", approveCompanyLoginRequest);
router.post("/super-admin/company-login-requests/:id/reject", rejectCompanyLoginRequest);

// Subscriptions
router.get("/super-admin/subscriptions", listSubscriptions);
router.post("/super-admin/subscriptions", createSubscription);
router.put("/super-admin/subscriptions/:id", updateSubscription);
router.delete("/super-admin/subscriptions/:id", deleteSubscription);

// Billing
router.get("/super-admin/billing", listBilling);
router.post("/super-admin/billing", createBilling);
router.put("/super-admin/billing/:id", updateBilling);
router.delete("/super-admin/billing/:id", deleteBilling);

// Company menu permissions
router.get("/super-admin/company-menu-permissions", getCompanyMenuPermissions);
router.post("/super-admin/company-menu-permissions", setCompanyMenuPermissions);

// Company menu trial settings
router.get("/super-admin/company-menu-trial-settings", getCompanyMenuTrialSettings);
router.post("/super-admin/company-menu-trial-settings", setCompanyMenuTrialSettings);

// Trail version config (separate table) + full details
router.get("/super-admin/trail-version-config", getTrailVersionConfigList);
router.post("/super-admin/trail-version-config", saveTrailVersionConfig);
router.get("/super-admin/trail-version-details", getTrailVersionDetails);

export default router;

