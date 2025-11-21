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

const router = express.Router();

router.post("/applyLeave", applyLeave);
router.post("/applycompOff", applyCompOff);
router.get("/getLeaveDetails", getLeaveDetails);
router.get("/getcompOffDetails", getCompOffDetails);
router.put("/updateLeave/:id", updateLeave);
router.put("/compOff/:id", updateCompOff);
router.put("/updateCompOff/:compOffId", updateCompOff);
router.delete("/deleteLeave/:id", deleteLeave);
router.delete("/deletecompOff/:id", deleteCompOff);

export default router;

