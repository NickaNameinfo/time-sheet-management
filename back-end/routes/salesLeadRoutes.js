import express from "express";
import {
  createLead,
  getLeadList,
  getLeadById,
  updateLead,
  deleteLead,
  getCompanySizeOptions,
} from "../controllers/salesLeadController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.get("/sales-leads/company-size-options", getCompanySizeOptions);
router.post("/sales-leads", verifyUser, createLead);
router.get("/sales-leads/list", verifyUser, getLeadList);
router.get("/sales-leads/:id", verifyUser, getLeadById);
router.put("/sales-leads/update/:id", verifyUser, updateLead);
router.delete("/sales-leads/delete/:id", verifyUser, deleteLead);

export default router;
