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
  updateProjectPlan,
  assignEmployeesToPlan,
  getProjectEmployees,
  getEmployeeAssignedProjects,
  deleteProjectPlan,
} from "../controllers/projectPlanController.js";

const router = express.Router();

router.post("/project/create", createProject);
router.get("/getProject", getProjects);
router.get("/getProject/:id", getProjectById);
router.put("/project/update/:projectId", updateProject);
router.put("/project/update/completion/:projectId", updateProjectCompletion);
router.delete("/project/delete/:id", deleteProject);
router.post("/project/addWorkDetails", addWorkDetails);
router.put("/project/updateWorkDetails/:id", updateWorkDetails);
router.get("/getWorkDetails", getWorkDetails);
router.get("/getBioDetails", getBioDetails);
router.post("/filterTimeSheet", filterTimeSheet);
router.post("/project/workDetails/clockIn", clockIn);
router.post("/project/workDetails/clockOut", clockOut);

// Project Plan Routes
router.post("/project-plan/create", createProjectPlan);
router.get("/project-plan", getProjectPlans);
router.get("/project-plan/:id", getProjectPlanById);
router.put("/project-plan/:id", updateProjectPlan);
router.put("/project-plan/:id/assign-employees", assignEmployeesToPlan);
router.get("/project/:project_id/employees", getProjectEmployees);
router.get("/project-plan/employee/assigned", getEmployeeAssignedProjects);
router.delete("/project-plan/:id", deleteProjectPlan);

export default router;

