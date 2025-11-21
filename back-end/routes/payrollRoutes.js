import express from "express";
import {
  generatePayrollSummary,
  exportToTally,
  exportToQuickBooks,
} from "../controllers/payrollController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.get("/payroll/summary", verifyUser, generatePayrollSummary);
router.get("/payroll/export/tally", verifyUser, exportToTally);
router.get("/payroll/export/quickbooks", verifyUser, exportToQuickBooks);

export default router;

