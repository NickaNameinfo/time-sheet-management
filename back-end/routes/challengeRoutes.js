import express from "express";
import {
  sendOtp,
  register,
  login,
  logout,
  sendResetOtp,
  resetPassword,
  changePassword,
  accessWithEmployee,
  getProfile,
  updateProfile,
} from "../controllers/challengeAuthController.js";
import {
  createChallenge,
  listChallenges,
  getChallenge,
  updateChallengeReminder,
  markDayComplete,
  getDashboard,
  getReports,
  getSettings,
  updateSettings,
  deleteAccount,
} from "../controllers/challengeController.js";
import { verifyChallengeUser } from "../middleware/challengeAuth.js";
import { verifyUser } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Public auth
router.post("/challenge-auth/send-otp", authLimiter, sendOtp);
router.post("/challenge-auth/register", authLimiter, register);
router.post("/challenge-auth/login", authLimiter, login);
router.post("/challenge-auth/logout", logout);
router.post("/challenge-auth/send-reset-otp", authLimiter, sendResetOtp);
router.post("/challenge-auth/reset-password", authLimiter, resetPassword);
router.post("/challenge-auth/change-password", verifyChallengeUser, changePassword);
// Employee SSO: use Time Sheet token to get My Self access (no separate login)
router.post("/challenge-auth/access-with-employee", verifyUser, accessWithEmployee);

// Protected routes
router.get("/challenge/dashboard", verifyChallengeUser, getDashboard);
router.get("/challenge/profile", verifyChallengeUser, getProfile);
router.put("/challenge/profile", verifyChallengeUser, updateProfile);
router.get("/challenge/settings", verifyChallengeUser, getSettings);
router.put("/challenge/settings", verifyChallengeUser, updateSettings);
router.delete("/challenge/account", verifyChallengeUser, deleteAccount);

router.post("/challenge", verifyChallengeUser, createChallenge);
router.get("/challenge/list", verifyChallengeUser, listChallenges);
router.get("/challenge/reports", verifyChallengeUser, getReports);
router.get("/challenge/:id", verifyChallengeUser, getChallenge);
router.put("/challenge/:id/reminder", verifyChallengeUser, updateChallengeReminder);
router.post("/challenge/day/:dayId/complete", verifyChallengeUser, markDayComplete);

export default router;
