import express from "express";
import {
  getApprovalWorkflows,
  createApprovalWorkflow,
  approveEntity,
  getApprovalHistory,
  getPendingApprovals,
  bulkApprove,
} from "../controllers/approvalController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.get("/approvals/workflows", verifyUser, getApprovalWorkflows);
router.post("/approvals/workflows", verifyUser, createApprovalWorkflow);
router.post("/approvals/:entityType/:entityId", verifyUser, approveEntity);
router.get("/approvals/history", verifyUser, getApprovalHistory);
router.get("/approvals/pending", verifyUser, getPendingApprovals);
router.post("/approvals/bulk", verifyUser, bulkApprove);

export default router;

