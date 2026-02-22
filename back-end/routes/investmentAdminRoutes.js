import express from "express";
import { listKycForAdmin, updateKycStatus, getKycDocument } from "../controllers/investmentKycController.js";
import {
  getReportsAdmin,
  getReportByIdAdmin,
  listWithdrawalRequests,
  updateWithdrawalRequestStatus,
  listReferralEarningsForAdmin,
  backfillReferralEarnings,
  approveReferralEarning,
} from "../controllers/investmentController.js";
import { verifyUser } from "../middleware/auth.js";
import { verifyRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/admin/investment/kyc", verifyUser, verifyRole("admin"), listKycForAdmin);
router.get("/admin/investment/kyc/document/:userId/:type", verifyUser, verifyRole("admin"), getKycDocument);
router.patch("/admin/investment/kyc/status", verifyUser, verifyRole("admin"), updateKycStatus);
router.get("/admin/investment/reports", verifyUser, verifyRole("admin"), getReportsAdmin);
router.get("/admin/investment/reports/:id", verifyUser, verifyRole("admin"), getReportByIdAdmin);
router.get("/admin/investment/withdrawal-requests", verifyUser, verifyRole("admin"), listWithdrawalRequests);
router.patch("/admin/investment/withdrawal-requests/:id", verifyUser, verifyRole("admin"), updateWithdrawalRequestStatus);
router.get("/admin/investment/referral-earnings", verifyUser, verifyRole("admin"), listReferralEarningsForAdmin);
router.post("/admin/investment/referral-earnings/backfill", verifyUser, verifyRole("admin"), backfillReferralEarnings);
router.patch("/admin/investment/referral-earnings/:id", verifyUser, verifyRole("admin"), approveReferralEarning);

export default router;
