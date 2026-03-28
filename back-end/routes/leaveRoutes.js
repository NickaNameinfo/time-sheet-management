import express from "express";
import {
  applyLeave,
  applyCompOff,
  getLeaveDetails,
  getCompOffDetails,
  updateLeave,
  updateCompOff,
  deleteLeave,
  deleteCompOff,
} from "../controllers/leaveController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/applyLeave", verifyUser, applyLeave);
router.post("/applycompOff", verifyUser, applyCompOff);
router.get("/getLeaveDetails", verifyUser, getLeaveDetails);
router.get("/getcompOffDetails", verifyUser, getCompOffDetails);
router.put("/updateLeave/:id", verifyUser, updateLeave);
router.put("/compOff/:id", verifyUser, updateCompOff);
router.put("/updateCompOff/:compOffId", verifyUser, updateCompOff);
router.delete("/deleteLeave/:id", verifyUser, deleteLeave);
router.delete("/deletecompOff/:id", verifyUser, deleteCompOff);

export default router;

