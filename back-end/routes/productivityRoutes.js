import express from "express";
import {
  calculateProductivity,
  getProductivityMetrics,
  getTeamProductivity,
  getProductivityTrends,
} from "../controllers/productivityController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/productivity/calculate", verifyUser, calculateProductivity);
router.get("/productivity/metrics", verifyUser, getProductivityMetrics);
router.get("/productivity/team", verifyUser, getTeamProductivity);
router.get("/productivity/trends", verifyUser, getProductivityTrends);

export default router;

