import express from "express";
import {
  getOTRules,
  createOTRule,
  calculateOvertime,
  getOTRecords,
  approveOT,
  bulkInsertOTRecords,
} from "../controllers/overtimeController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.get("/overtime/rules", getOTRules);
router.post("/overtime/rules", verifyUser, createOTRule);
router.post("/overtime/calculate", verifyUser, calculateOvertime);
router.get("/overtime/records", verifyUser, getOTRecords);
router.post("/overtime/approve/:id", verifyUser, approveOT);
router.post("/overtime/bulk", verifyUser, bulkInsertOTRecords);

export default router;

