import express from "express";
import { listUsersAdmin, getReportsAdmin } from "../controllers/challengeController.js";
import { verifyUser } from "../middleware/auth.js";
import { verifyRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/admin/challenge/users", verifyUser, verifyRole("admin"), listUsersAdmin);
router.get("/admin/challenge/reports", verifyUser, verifyRole("admin"), getReportsAdmin);

export default router;
