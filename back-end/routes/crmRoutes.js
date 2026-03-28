import express from "express";
import rateLimit from "express-rate-limit";
import {
  createCrm,
  createCrmPublic,
  getCrmList,
  getCrmById,
  updateCrm,
  deleteCrm,
  getCrmSummary,
} from "../controllers/crmController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

const publicCrmLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { Status: "Error", Error: "Too many requests. Please try again shortly." },
});

// Public CRM endpoint for external sales websites (API key based)
router.post("/crm/public/create", publicCrmLimiter, createCrmPublic);

// CRM routes - all require authentication
router.post("/crm/create", verifyUser, createCrm);
router.get("/crm/list", verifyUser, getCrmList);
router.get("/crm/summary", verifyUser, getCrmSummary);
router.get("/crm/:id", verifyUser, getCrmById);
router.put("/crm/update/:id", verifyUser, updateCrm);
router.delete("/crm/delete/:id", verifyUser, deleteCrm);

export default router;

