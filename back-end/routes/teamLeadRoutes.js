import express from "express";
import {
  createTeamLead,
  getTeamLeads,
  deleteTeamLead,
} from "../controllers/teamLeadController.js";

const router = express.Router();

router.post("/lead/create", createTeamLead);
router.get("/getLead", getTeamLeads);
router.delete("/lead/delete/:id", deleteTeamLead);

export default router;

