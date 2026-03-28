import express from "express";
import {
  createHr,
  getHr,
  deleteHr,
} from "../controllers/hrController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/hr/create", verifyUser, createHr);
router.get("/getHr", verifyUser, getHr);
router.delete("/hr/delete/:id", verifyUser, deleteHr);

export default router;

