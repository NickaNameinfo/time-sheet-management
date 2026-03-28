import express from "express";
import {
  createTeamLead,
  getTeamLeads,
  deleteTeamLead,
} from "../controllers/teamLeadController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/lead/create", verifyUser, createTeamLead);
router.get("/getLead", verifyUser, getTeamLeads);
router.delete("/lead/delete/:id", verifyUser, deleteTeamLead);

export default router;

