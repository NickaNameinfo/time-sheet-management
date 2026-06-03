import express from "express";
import {
  generatePayrollSummary,
  exportToTally,
  exportToQuickBooks,
} from "../controllers/payrollController.js";
import {
  listSalaryPayslips,
  listMyPaidPayslips,
  getMyPayslipPeriodSummary,
  getSalaryPayslipDetail,
  getEmployeeAttendanceForPayslip,
  upsertSalaryPayslip,
} from "../controllers/payslipController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.get("/payroll/summary", verifyUser, generatePayrollSummary);
router.get("/payroll/export/tally", verifyUser, exportToTally);
router.get("/payroll/export/quickbooks", verifyUser, exportToQuickBooks);

router.get("/payroll/my-payslips", verifyUser, listMyPaidPayslips);
router.get("/payroll/my-period-summary", verifyUser, getMyPayslipPeriodSummary);
router.get("/payroll/salary-payslips", verifyUser, listSalaryPayslips);
router.get("/payroll/salary-payslips/:employeeId/detail", verifyUser, getSalaryPayslipDetail);
router.get("/payroll/salary-payslips/:employeeId/attendance", verifyUser, getEmployeeAttendanceForPayslip);
router.post("/payroll/salary-payslips", verifyUser, upsertSalaryPayslip);

export default router;

