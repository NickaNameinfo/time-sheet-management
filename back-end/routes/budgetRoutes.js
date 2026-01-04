import express from "express";
import {
  getProjectBudget,
  setProjectBudget,
  updateProjectBudget,
  deleteProjectBudget,
  trackProjectCost,
  updateProjectCost,
  deleteProjectCost,
  getProjectCosts,
  getBudgetVsActual,
  getProfitabilityReport,
} from "../controllers/budgetController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.get("/projects/:projectId/budget", verifyUser, getProjectBudget);
router.post("/projects/:projectId/budget", verifyUser, setProjectBudget);
router.put("/projects/budget/:id", verifyUser, updateProjectBudget);
router.delete("/projects/budget/:id", verifyUser, deleteProjectBudget);
router.post("/projects/:projectId/costs", verifyUser, trackProjectCost);
router.put("/projects/costs/:id", verifyUser, updateProjectCost);
router.delete("/projects/costs/:id", verifyUser, deleteProjectCost);
router.get("/projects/:projectId/costs", verifyUser, getProjectCosts);
router.get("/projects/:projectId/budget-vs-actual", verifyUser, getBudgetVsActual);
router.get("/projects/:projectId/profitability", verifyUser, getProfitabilityReport);

export default router;

