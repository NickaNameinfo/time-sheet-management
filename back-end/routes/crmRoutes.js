import express from "express";
import {
  createCrm,
  getCrmList,
  getCrmById,
  updateCrm,
  deleteCrm,
  getCrmSummary,
} from "../controllers/crmController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

// CRM routes - all require authentication
router.post("/crm/create", verifyUser, createCrm);
router.get("/crm/list", verifyUser, getCrmList);
router.get("/crm/summary", verifyUser, getCrmSummary);
router.get("/crm/:id", verifyUser, getCrmById);
router.put("/crm/update/:id", verifyUser, updateCrm);
router.delete("/crm/delete/:id", verifyUser, deleteCrm);

export default router;

