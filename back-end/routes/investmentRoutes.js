import express from "express";
import multer from "multer";
import path from "path";
import config from "../config/index.js";
import { getKycStatus, submitKyc, uploadKycDocuments } from "../controllers/investmentKycController.js";
import {
  getPlans,
  getDashboard,
  validateCheckout,
  createRazorpayOrder,
  createInvestmentAfterPayment,
  listInvestments,
  getReferralStats,
  getReferralHistory,
  getWithdrawPreview,
  withdraw,
  getReports,
  getReportById,
  getNotifications,
  markNotificationRead,
} from "../controllers/investmentController.js";
import { verifyChallengeUser } from "../middleware/challengeAuth.js";

const router = express.Router();

const kycStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.upload.dir),
  filename: (req, file, cb) => cb(null, `kyc_${file.fieldname}_${Date.now()}${path.extname(file.originalname) || ".jpg"}`),
});
const kycUpload = multer({
  storage: kycStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /^image\/(jpe?g|png|webp)$/i.test(file.mimetype) || file.mimetype === "application/pdf";
    cb(null, !!allowed);
  },
}).fields([
  { name: "aadhaar_document", maxCount: 1 },
  { name: "pan_document", maxCount: 1 },
]);

// Apply challenge auth per route so admin routes (mounted elsewhere) are not affected
router.get("/investment/kyc/status", verifyChallengeUser, getKycStatus);
router.post("/investment/kyc/submit", verifyChallengeUser, kycUpload, submitKyc);
router.post("/investment/kyc/documents", verifyChallengeUser, kycUpload, uploadKycDocuments);

router.get("/investment/plans", verifyChallengeUser, getPlans);
router.get("/investment/dashboard", verifyChallengeUser, getDashboard);
router.post("/investment/checkout/validate", verifyChallengeUser, validateCheckout);
router.post("/investment/checkout/create-order", verifyChallengeUser, createRazorpayOrder);
router.post("/investment/payment/success", verifyChallengeUser, createInvestmentAfterPayment);

router.get("/investment/list", verifyChallengeUser, listInvestments);
router.get("/investment/referral/stats", verifyChallengeUser, getReferralStats);
router.get("/investment/referral/history", verifyChallengeUser, getReferralHistory);
router.get("/investment/withdraw/preview/:investment_id", verifyChallengeUser, getWithdrawPreview);
router.post("/investment/withdraw", verifyChallengeUser, withdraw);

router.get("/investment/reports", verifyChallengeUser, getReports);
router.get("/investment/reports/:id", verifyChallengeUser, getReportById);
router.get("/investment/notifications", verifyChallengeUser, getNotifications);
router.put("/investment/notifications/:id/read", verifyChallengeUser, markNotificationRead);

export default router;
