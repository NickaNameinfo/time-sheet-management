import express from "express";
import {
  adminLogin,
  employeeLogin,
  teamLeadLogin,
  hrLogin,
  dashboard,
  logout,
} from "../controllers/authController.js";
import { verifyUser } from "../middleware/auth.js";
import { loginValidation, handleValidationErrors } from "../utils/validation.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/login", authLimiter, loginValidation, handleValidationErrors, adminLogin);
router.post(
  "/employeelogin",
  authLimiter,
  loginValidation,
  handleValidationErrors,
  employeeLogin
);
router.post("/teamLeadlogin", authLimiter, loginValidation, handleValidationErrors, teamLeadLogin);
router.post("/hrLogin", authLimiter, loginValidation, handleValidationErrors, hrLogin);
router.post("/dashboard", verifyUser, dashboard);
router.get("/logout", logout);

export default router;

