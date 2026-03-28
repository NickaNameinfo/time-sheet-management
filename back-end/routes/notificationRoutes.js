import express from "express";
import { sendNotification, getNotifications } from "../controllers/notificationController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/sendNotification", verifyUser, sendNotification);
router.get("/notifications", verifyUser, getNotifications);

export default router;

