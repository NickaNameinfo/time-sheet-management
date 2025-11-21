import express from "express";
import {
  getReportSchedules,
  createReportSchedule,
  generateAndSendReport,
  generateReport,
  updateReportSchedule,
  deleteReportSchedule,
} from "../controllers/reportController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.get("/reports/schedules", verifyUser, getReportSchedules);
router.post("/reports/schedules", verifyUser, createReportSchedule);
router.put("/reports/schedules/:id", verifyUser, updateReportSchedule);
router.delete("/reports/schedules/:id", verifyUser, deleteReportSchedule);
router.post("/reports/send/:scheduleId", verifyUser, generateAndSendReport);
router.get("/reports/generate", verifyUser, generateReport);
router.post("/reports/generate", verifyUser, generateReport);

export default router;

