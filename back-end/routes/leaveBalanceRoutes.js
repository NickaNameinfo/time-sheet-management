import express from "express";
import multer from "multer";
import path from "path";
import config from "../config/index.js";
import {
  getLeaveBalance,
  initializeLeaveBalance,
  accrueLeave,
  useLeave,
  getLeaveAccruals,
  uploadLeaveDocument,
  getLeaveDocuments,
} from "../controllers/leaveBalanceController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (req, file, cb) => {
    cb(null, `leave_doc_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

router.get("/leave/balance", verifyUser, getLeaveBalance);
router.post("/leave/balance/initialize", verifyUser, initializeLeaveBalance);
router.post("/leave/accrue", verifyUser, accrueLeave);
router.post("/leave/use", verifyUser, useLeave);
router.get("/leave/accruals", verifyUser, getLeaveAccruals);
router.post("/leave/documents", upload.single("document"), verifyUser, uploadLeaveDocument);
router.get("/leave/documents/:leaveId", verifyUser, getLeaveDocuments);

export default router;

