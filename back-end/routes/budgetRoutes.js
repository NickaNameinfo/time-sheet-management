import express from "express";
import {
  getProjectBudget,
  setProjectBudget,
  trackProjectCost,
  getProjectCosts,
  getBudgetVsActual,
  getProfitabilityReport,
} from "../controllers/budgetController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.get("/projects/:projectId/budget", verifyUser, getProjectBudget);
router.post("/projects/:projectId/budget", verifyUser, setProjectBudget);
router.post("/projects/:projectId/costs", verifyUser, trackProjectCost);
router.get("/projects/:projectId/costs", verifyUser, getProjectCosts);
router.get("/projects/:projectId/budget-vs-actual", verifyUser, getBudgetVsActual);
router.get("/projects/:projectId/profitability", verifyUser, getProfitabilityReport);

export default router;

