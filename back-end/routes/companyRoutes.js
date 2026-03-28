import express from "express";
import { verifyUser } from "../middleware/auth.js";
import { getMyCompanyLoginEmails } from "../controllers/companyProfileLoginController.js";
import {
  createCompanyLoginRequest,
  listMyCompanyLoginRequests,
} from "../controllers/companyLoginRequestController.js";

const router = express.Router();

// Company-safe endpoint: only returns login emails for the logged-in company.
router.get("/company/profile-login-emails", verifyUser, getMyCompanyLoginEmails);

// Request new company profile login (pending Super Admin approval)
router.post("/company/login-requests", verifyUser, createCompanyLoginRequest);
router.get("/company/login-requests", verifyUser, listMyCompanyLoginRequests);

export default router;

