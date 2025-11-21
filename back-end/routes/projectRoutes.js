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
router.post("/workDetails/clockIn", clockIn);
router.post("/workDetails/clockOut", clockOut);

export default router;

