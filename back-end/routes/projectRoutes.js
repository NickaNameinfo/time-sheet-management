import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  updateProjectCompletion,
  deleteProject,
  addWorkDetails,
  updateWorkDetails,
  getWorkDetails,
  getBioDetails,
  filterTimeSheet,
  clockIn,
  clockOut,
} from "../controllers/projectController.js";
import {
  createProjectPlan,
  getProjectPlans,
  getProjectPlanById,
  getPlanUtilization,
  updateProjectPlan,
  assignEmployeesToPlan,
  getProjectEmployees,
  getEmployeeAssignedProjects,
  deleteProjectPlan,
} from "../controllers/projectPlanController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/project/create", verifyUser, createProject);
router.get("/getProject", verifyUser, getProjects);
router.get("/getProject/:id", verifyUser, getProjectById);
router.put("/project/update/:projectId", verifyUser, updateProject);
router.put("/project/update/completion/:projectId", verifyUser, updateProjectCompletion);
router.delete("/project/delete/:id", verifyUser, deleteProject);
router.post("/project/addWorkDetails", verifyUser, addWorkDetails);
router.put("/project/updateWorkDetails/:id", verifyUser, updateWorkDetails);
router.get("/getWorkDetails", verifyUser, getWorkDetails);
router.get("/getBioDetails", verifyUser, getBioDetails);
router.post("/filterTimeSheet", verifyUser, filterTimeSheet);
router.post("/project/workDetails/clockIn", verifyUser, clockIn);
router.post("/project/workDetails/clockOut", verifyUser, clockOut);

// Project Plan Routes
router.post("/project-plan/create", verifyUser, createProjectPlan);
router.get("/project-plan", verifyUser, getProjectPlans);
// Static path before "/project-plan/:id" so it is not captured as an id
router.get("/project-plan/employee/assigned", verifyUser, getEmployeeAssignedProjects);
router.get("/project-plan/:id/utilization", verifyUser, getPlanUtilization);
router.get("/project-plan/:id", verifyUser, getProjectPlanById);
router.put("/project-plan/:id", verifyUser, updateProjectPlan);
router.put("/project-plan/:id/assign-employees", verifyUser, assignEmployeesToPlan);
router.get("/project/:project_id/employees", verifyUser, getProjectEmployees);
router.delete("/project-plan/:id", verifyUser, deleteProjectPlan);

export default router;

