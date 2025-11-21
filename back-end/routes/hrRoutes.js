import express from "express";
import {
  createHr,
  getHr,
  deleteHr,
} from "../controllers/hrController.js";

const router = express.Router();

router.post("/hr/create", createHr);
router.get("/getHr", getHr);
router.delete("/hr/delete/:id", deleteHr);

export default router;

