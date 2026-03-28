import express from "express";
import {
  getSettings,
  updateSettings,
  listRequests,
  createRequest,
  approveRequest,
  rejectRequest,
} from "../controllers/userAccessController.js";
import { verifyUser, verifyRole } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Admin only
router.get("/user-access/settings", verifyUser, verifyRole("admin"), getSettings);
router.put("/user-access/settings", verifyUser, verifyRole("admin"), updateSettings);
router.get("/user-access/requests", verifyUser, verifyRole("admin"), listRequests);
router.post("/user-access/requests/:id/approve", verifyUser, verifyRole("admin"), approveRequest);
router.post("/user-access/requests/:id/reject", verifyUser, verifyRole("admin"), rejectRequest);

// Public – request access (rate limited)
router.post("/user-access/request", authLimiter, createRequest);

export default router;
