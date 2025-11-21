import express from "express";
import {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
  assignShift,
  getShiftAssignments,
  requestShiftSwap,
  approveShiftSwap,
  getShiftSwaps,
} from "../controllers/shiftController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.get("/shifts", getShifts);
router.post("/shifts", verifyUser, createShift);
router.put("/shifts/:id", verifyUser, updateShift);
router.delete("/shifts/:id", verifyUser, deleteShift);
router.post("/shifts/assign", verifyUser, assignShift);
router.get("/shifts/assignments", verifyUser, getShiftAssignments);
router.post("/shifts/swap", verifyUser, requestShiftSwap);
router.put("/shifts/swap/:id", verifyUser, approveShiftSwap);
router.get("/shifts/swaps", verifyUser, getShiftSwaps);

export default router;

